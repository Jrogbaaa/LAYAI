'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface Message {
  text: string;
  sender: 'user' | 'bot';
  type: 'chat' | 'search';
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
  }, [messages]);

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

    try {
      const response = await onSendMessage(inputMessage, messages);
      
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
    } catch (error) {
      const errorMessage: Message = {
        text: 'Lo siento, encontré un error. Por favor, inténtalo de nuevo.',
        sender: 'bot',
        type: 'chat',
      };
      setMessages(prev => [...prev, errorMessage]);
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
        
        {isLoading && (
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