'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface Message {
  text: string;
  sender: 'user' | 'bot';
  type: 'chat' | 'search';
}

interface SearchProgress {
  stage: string;
  progress: number;
  details: string;
  isComplete: boolean;
}

interface ChatbotProps {
  onSendMessage: (message: string, history: Message[]) => Promise<any>;
}

export function Chatbot({ onSendMessage }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "¡Hola! Soy tu asistente de IA para encontrar influencers. Pídeme que encuentre creadores según criterios como:\n\n🔍 'Encuentra influencers de moda en Instagram con 10k-100k seguidores'\n🎯 'Muéstrame YouTubers de tecnología en California'\n💄 'Encuentra influencers de belleza con altas tasas de engagement'\n\n💡 ¡Después de mostrar resultados, puedes hacer preguntas de seguimiento para añadir más resultados!",
      sender: 'bot',
      type: 'chat',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Auto-scroll to bottom for new messages, but keep it contained within the chat
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  useEffect(() => {
    // Always scroll to bottom when new messages are added
    scrollToBottom();
  }, [messages, searchProgress]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      text: inputMessage,
      sender: 'user',
      type: 'chat',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setSearchProgress(null);

    try {
      // Check if this is likely a search query
      const isSearchQuery = inputMessage.toLowerCase().includes('encuentra') || 
                           inputMessage.toLowerCase().includes('busca') || 
                           inputMessage.toLowerCase().includes('find') || 
                           inputMessage.toLowerCase().includes('search') ||
                           inputMessage.toLowerCase().includes('influencer');

      if (isSearchQuery) {
        // Start progress tracking for search queries
        setSearchProgress({
          stage: 'Iniciando búsqueda...',
          progress: 5,
          details: 'Analizando criterios de búsqueda',
          isComplete: false
        });

        // Simulate progress updates during search - realistic timing for 1-2 minute searches
        let currentStage = 0;
        const stages = [
          { stage: 'Procesando consulta...', details: 'Extrayendo parámetros de búsqueda con IA', duration: 3000, endProgress: 15 },
          { stage: 'Buscando en base de datos...', details: 'Consultando influencers verificados', duration: 8000, endProgress: 25 },
          { stage: 'Búsqueda en tiempo real...', details: 'Descubriendo nuevos perfiles en redes sociales', duration: 45000, endProgress: 60 },
          { stage: 'Extrayendo perfiles...', details: 'Scrapeando datos de influencers encontrados', duration: 40000, endProgress: 80 },
          { stage: 'Verificando perfiles...', details: 'Validando métricas y filtrando marcas', duration: 15000, endProgress: 90 },
          { stage: 'Analizando compatibilidad...', details: 'Calculando puntuaciones de marca', duration: 8000, endProgress: 95 },
          { stage: 'Finalizando...', details: 'Preparando resultados', duration: 3000, endProgress: 98 }
        ];

        const progressInterval = setInterval(() => {
          setSearchProgress(prev => {
            if (!prev || currentStage >= stages.length) return prev;
            
            const stage = stages[currentStage];
            const increment = (stage.endProgress - (currentStage > 0 ? stages[currentStage - 1].endProgress : 5)) / (stage.duration / 1000);
            
            if (prev.progress >= stage.endProgress) {
              currentStage++;
              if (currentStage < stages.length) {
                return {
                  stage: stages[currentStage].stage,
                  progress: prev.progress + 1,
                  details: stages[currentStage].details,
                  isComplete: false
                };
              }
              return prev;
            }
            
            return {
              stage: stage.stage,
              progress: Math.min(prev.progress + increment, stage.endProgress),
              details: stage.details,
              isComplete: false
            };
          });
        }, 1000);

        const response = await onSendMessage(inputMessage, messages);

        // Clear progress interval
        clearInterval(progressInterval);
        
        // Complete progress
        setSearchProgress({
          stage: '¡Búsqueda completada!',
          progress: 100,
          details: 'Resultados listos',
          isComplete: true
        });

        // Clear progress after a short delay
        setTimeout(() => {
          setSearchProgress(null);
        }, 1500);

        let botResponse: Message;
        if (response.type === 'search') {
          // Access the search data properly - it's nested in response.data.data
          const searchData = response.data?.data || response.data;
          const totalFound = searchData?.totalFound || 0;
          
          botResponse = {
            text: `🔍 ¡Encontré ${totalFound} influencers que coinciden con tus criterios! Revisa los resultados a continuación.`,
            sender: 'bot',
            type: 'search',
          };
        } else {
          botResponse = {
            text: response.data || 'Recibí tu mensaje. ¿Cómo puedo ayudarte a encontrar influencers?',
            sender: 'bot',
            type: 'chat',
          };
        }

        setMessages(prev => [...prev, botResponse]);
      } else {
        // Regular chat without progress
        const response = await onSendMessage(inputMessage, messages);
        
        const botResponse: Message = {
          text: response.data || 'Recibí tu mensaje. ¿Cómo puedo ayudarte a encontrar influencers?',
          sender: 'bot',
          type: 'chat',
        };

        setMessages(prev => [...prev, botResponse]);
      }
    } catch (error) {
      const errorMessage: Message = {
        text: 'Lo siento, encontré un error. Por favor, inténtalo de nuevo.',
        sender: 'bot',
        type: 'chat',
      };
      setMessages(prev => [...prev, errorMessage]);
      setSearchProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white rounded-none sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full min-h-[400px] max-h-[70vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Asistente de IA para Influencers</h2>
            <p className="text-blue-100 text-sm">Encuentra los creadores perfectos para tus campañas</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 min-h-0">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
        
                 {/* Progress Bar for Search */}
         {searchProgress && (
           <div className="flex justify-start">
             <div className="bg-white text-gray-800 border border-gray-200 px-5 py-4 rounded-2xl shadow-lg max-w-md w-full">
               <div className="space-y-4">
                 {/* Header with icon and stage */}
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     <div className="text-lg">🔍</div>
                     <span className="text-sm font-semibold text-gray-800">{searchProgress.stage}</span>
                   </div>
                   <div className="flex items-center space-x-1">
                     <span className="text-xs font-medium text-gray-600">{Math.round(searchProgress.progress)}%</span>
                     {searchProgress.isComplete && <span className="text-green-500 text-sm">✅</span>}
                   </div>
                 </div>
                 
                 {/* Progress Bar */}
                 <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                   <div 
                     className={`h-3 rounded-full transition-all duration-500 ease-out ${
                       searchProgress.isComplete 
                         ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg' 
                         : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 shadow-md'
                     }`}
                     style={{ width: `${searchProgress.progress}%` }}
                   >
                     {/* Animated shine effect */}
                     {!searchProgress.isComplete && (
                       <div className="h-full w-full rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                     )}
                   </div>
                 </div>
                 
                 {/* Details */}
                 <div className="flex items-center space-x-2">
                   {!searchProgress.isComplete && (
                     <div className="flex space-x-1">
                       <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                       <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                       <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                     </div>
                   )}
                   <span className="text-xs text-gray-600 leading-relaxed">{searchProgress.details}</span>
                 </div>
                 
                 {/* Estimated time remaining (only for active searches) */}
                 {!searchProgress.isComplete && searchProgress.progress > 10 && (
                   <div className="text-xs text-gray-500 italic">
                     ⏱️ Tiempo estimado: {searchProgress.progress < 60 ? '60-90 segundos' : '30-45 segundos'}
                   </div>
                 )}
               </div>
             </div>
           </div>
         )}
        
        {/* Simple loading for non-search queries */}
        {isLoading && !searchProgress && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">Pensando...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pídeme que encuentre influencers..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-gray-50 focus:bg-white transition-colors"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 