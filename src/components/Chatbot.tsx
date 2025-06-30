'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';

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

// Helper function to detect brand collaboration queries
function detectCollaborationQuery(message: string): { influencer: string; brand: string } | null {
  const lowerMessage = message.toLowerCase();
  
  // Patterns to detect collaboration queries
  const patterns = [
    /(?:has|ha)\s+(\w+)\s+(?:worked|trabajado)\s+(?:with|con)\s+(\w+)/i,
    /(\w+)\s+(?:ha\s+trabajado|worked)\s+(?:con|with)\s+(\w+)/i,
    /(?:colaborado|collaborated)\s+(\w+)\s+(?:con|with)\s+(\w+)/i,
    /(\w+)\s+(?:colaborado|collaborated)\s+(?:con|with)\s+(\w+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const influencer = match[1].toLowerCase();
      const brand = match[2].toLowerCase();
      return { influencer, brand };
    }
  }
  
  return null;
}

export function Chatbot({ onSendMessage }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "¡Hola! Soy tu asistente de IA para encontrar influencers. Puedes:\n\n🔍 Escribir tu búsqueda: 'Encuentra influencers de moda en Instagram'\n📄 Subir una propuesta PDF para búsqueda personalizada\n🤝 Preguntar sobre colaboraciones: '¿Ha trabajado Cristiano con IKEA?'\n💡 Hacer preguntas de seguimiento para refinar resultados\n\n¿Cómo te gustaría empezar?",
      sender: 'bot',
      type: 'chat',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [awaitingAdditionalInfo, setAwaitingAdditionalInfo] = useState(false);
  const [readyToSearch, setReadyToSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (file: File) => {
    if (file.type !== 'application/pdf') {
      const errorMessage: Message = {
        text: '❌ Por favor, sube solo archivos PDF.',
        sender: 'bot',
        type: 'chat',
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const errorMessage: Message = {
        text: '❌ El archivo es demasiado grande. Máximo 10MB.',
        sender: 'bot',
        type: 'chat',
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setUploadedFile(file);
    setShowPDFUpload(false);
    setIsAnalyzing(true);

    // Add user message about PDF upload
    const userMessage: Message = {
      text: `📄 Subí propuesta: ${file.name}`,
      sender: 'user',
      type: 'chat',
    };
    setMessages(prev => [...prev, userMessage]);

    // Add bot analyzing message
    const analyzingMessage: Message = {
      text: '🤖 Analizando tu propuesta PDF... Esto puede tomar unos segundos.',
      sender: 'bot',
      type: 'chat',
    };
    setMessages(prev => [...prev, analyzingMessage]);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/analyze-proposal', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setAnalysisResult(result.analysis);
        setAwaitingAdditionalInfo(true);
        setReadyToSearch(true);
        
        const analysisMessage: Message = {
          text: `✅ ¡Análisis completado! Detecté:\n\n${formatAnalysisForDisplay(result.analysis)}\n\n¿Hay alguna información adicional que te gustaría agregar o especificar para la búsqueda?`,
          sender: 'bot',
          type: 'chat',
        };
        setMessages(prev => [...prev, analysisMessage]);

      } else {
        const errorMessage: Message = {
          text: `❌ Error analizando PDF: ${result.error}`,
          sender: 'bot',
          type: 'chat',
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        text: '❌ Error procesando el PDF. Por favor, inténtalo de nuevo.',
        sender: 'bot',
        type: 'chat',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSearchFromAnalysis = (analysis: any): string => {
    const parts = [];
    
    if (analysis.brandName) {
      parts.push(`influencers compatibles con ${analysis.brandName}`);
    } else {
      parts.push('influencers');
    }

    if (analysis.targetAudience?.interests?.length > 0) {
      parts.push(`especializados en ${analysis.targetAudience.interests.join(', ').toLowerCase()}`);
    }

    if (analysis.targetAudience?.location) {
      parts.push(`en ${analysis.targetAudience.location}`);
    }

    if (analysis.targetAudience?.ageRange) {
      parts.push(`para audiencia de ${analysis.targetAudience.ageRange} años`);
    }

    if (analysis.platforms?.length > 0) {
      parts.push(`de ${analysis.platforms.join(', ')}`);
    }

    return parts.join(' ');
  };

  const formatAnalysisForDisplay = (analysis: any): string => {
    const details = [];
    
    if (analysis.brandName) details.push(`🏢 Marca: ${analysis.brandName}`);
    if (analysis.platforms?.length > 0) details.push(`📱 Plataformas: ${analysis.platforms.join(', ')}`);
    if (analysis.targetAudience?.ageRange) details.push(`👥 Edad: ${analysis.targetAudience.ageRange} años`);
    if (analysis.targetAudience?.location) details.push(`📍 Ubicación: ${analysis.targetAudience.location}`);
    if (analysis.budget?.min && analysis.budget?.max) {
      details.push(`💰 Presupuesto: ${analysis.budget.min}-${analysis.budget.max} ${analysis.budget.currency || 'EUR'}`);
    }

    return details.join('\n');
  };

  const handleSearchFromPDF = async (searchQuery: string) => {
    setIsLoading(true);
    setSearchProgress({
      stage: 'Iniciando búsqueda basada en PDF...',
      progress: 5,
      details: 'Procesando datos extraídos de la propuesta',
      isComplete: false
    });

    try {
      // Use the same progress tracking as regular searches
      let currentStage = 0;
      const stages = [
        { stage: 'Procesando propuesta...', details: 'Aplicando criterios extraídos del PDF', duration: 3000, endProgress: 15 },
        { stage: 'Buscando en base de datos...', details: 'Consultando influencers verificados', duration: 8000, endProgress: 25 },
        { stage: 'Búsqueda en tiempo real...', details: 'Descubriendo perfiles compatibles', duration: 45000, endProgress: 60 },
        { stage: 'Extrayendo perfiles...', details: 'Scrapeando datos de influencers encontrados', duration: 40000, endProgress: 80 },
        { stage: 'Verificando compatibilidad...', details: 'Analizando alineación con tu marca', duration: 15000, endProgress: 90 },
        { stage: 'Aplicando filtros de propuesta...', details: 'Refinando según criterios PDF', duration: 8000, endProgress: 95 },
        { stage: 'Finalizando...', details: 'Preparando resultados personalizados', duration: 3000, endProgress: 98 }
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

      const response = await onSendMessage(searchQuery, messages);

      clearInterval(progressInterval);
      
      setSearchProgress({
        stage: '🎉 ¡Búsqueda completada exitosamente!',
        progress: 100,
        details: `Encontrados ${response.data?.data?.totalFound || 0} influencers perfectos para tu campaña`,
        isComplete: true
      });

      setTimeout(() => {
        setSearchProgress(null);
        // Auto-scroll to results after progress clears
        setTimeout(() => {
          const resultsElement = document.querySelector('[data-testid="influencer-results"]');
          if (resultsElement) {
            resultsElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 300);
      }, 3000);

      let botResponse: Message;
      if (response.type === 'search') {
        // Access the search data properly - it's nested in response.data.data
        const searchData = response.data?.data || response.data;
        const totalFound = searchData?.totalFound || 0;
        
        botResponse = {
          text: `🎯 ¡BÚSQUEDA COMPLETADA! 🎯\n\n✅ Encontré ${totalFound} influencers perfectamente alineados con tus criterios\n\n📊 Los resultados están ordenados por compatibilidad de marca\n🔍 Revisa los perfiles a continuación para encontrar las mejores opciones\n\n💡 Todos los influencers han sido automáticamente guardados en tu campaña`,
          sender: 'bot',
          type: 'search',
        };
      } else {
        botResponse = {
          text: response.data || 'Búsqueda completada basada en tu propuesta PDF.',
          sender: 'bot',
          type: 'chat',
        };
      }

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      const errorMessage: Message = {
        text: 'Error en la búsqueda basada en PDF. Por favor, inténtalo de nuevo.',
        sender: 'bot',
        type: 'chat',
      };
      setMessages(prev => [...prev, errorMessage]);
      setSearchProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePDFUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removePDFFile = () => {
    setUploadedFile(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartSearchFromPDF = async () => {
    if (!analysisResult) return;
    
    setAwaitingAdditionalInfo(false);
    setReadyToSearch(false);
    
    const searchQuery = generateSearchFromAnalysis(analysisResult);
    
    const searchMessage: Message = {
      text: '🔍 Iniciando búsqueda personalizada basada en tu propuesta...',
      sender: 'bot',
      type: 'chat',
    };
    setMessages(prev => [...prev, searchMessage]);
    
    await handleSearchFromPDF(searchQuery);
  };

  const handleCollaborationCheck = async (influencer: string, brand: string) => {
    try {
      const response = await fetch('/api/check-brand-collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          influencerHandle: influencer,
          brandName: brand,
          postsToCheck: 20
        }),
      });

      const result = await response.json();

      let responseText = '';
      if (result.success && result.collaboration.hasCollaborated) {
        const { collaborationType, evidence, confidenceScore, lastCollabDate } = result.collaboration;
        
        if (collaborationType === 'partnership') {
          responseText = `✅ **SÍ, ${influencer.toUpperCase()} ha trabajado con ${brand.toUpperCase()}**\n\n🤝 **Tipo**: Colaboración comercial confirmada\n🎯 **Confianza**: ${confidenceScore}%`;
          if (lastCollabDate) {
            responseText += `\n📅 **Última colaboración**: ${lastCollabDate}`;
          }
        } else if (collaborationType === 'mention') {
          responseText = `✅ **SÍ, ${influencer.toUpperCase()} ha mencionado ${brand.toUpperCase()}**\n\n💬 **Tipo**: Mención de marca\n🎯 **Confianza**: ${confidenceScore}%`;
          if (lastCollabDate) {
            responseText += `\n📅 **Última mención**: ${lastCollabDate}`;
          }
        }

        if (evidence.length > 0) {
          responseText += `\n\n📝 **Evidencia encontrada**:\n${evidence.map((e: string) => `• ${e}`).join('\n')}`;
        }
      } else {
        responseText = `❌ **NO, ${influencer.toUpperCase()} no ha trabajado con ${brand.toUpperCase()}**\n\n🔍 **Análisis**: Revisé ${result.postsAnalyzed || 20} publicaciones recientes\n📊 **Resultado**: Sin colaboraciones o menciones detectadas`;
      }

      const collaborationResponse: Message = {
        text: responseText,
        sender: 'bot',
        type: 'chat',
      };

      setMessages(prev => [...prev, collaborationResponse]);

    } catch (error) {
      console.error('Error checking collaboration:', error);
      const errorMessage: Message = {
        text: `❌ Error al verificar la colaboración entre ${influencer} y ${brand}. Por favor, inténtalo de nuevo.`,
        sender: 'bot',
        type: 'chat',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      text: inputMessage,
      sender: 'user',
      type: 'chat',
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');

    // Check if user is responding to PDF additional info request
    if (awaitingAdditionalInfo) {
      const lowerMessage = messageToSend.toLowerCase();
      if (lowerMessage.includes('no') || lowerMessage.includes('nada') || lowerMessage.includes('está bien')) {
        setAwaitingAdditionalInfo(false);
        setReadyToSearch(false);
        
        const searchQuery = generateSearchFromAnalysis(analysisResult);
        
        const searchMessage: Message = {
          text: '🔍 Perfecto, iniciando búsqueda con la información de tu propuesta...',
          sender: 'bot',
          type: 'chat',
        };
        setMessages(prev => [...prev, searchMessage]);
        
        await handleSearchFromPDF(searchQuery);
        return;
      } else {
        // User wants to add additional info - treat it as additional search criteria
        setAwaitingAdditionalInfo(false);
        setReadyToSearch(false);
        
        // Combine PDF analysis with additional user input
        const baseQuery = generateSearchFromAnalysis(analysisResult);
        const enhancedQuery = `${baseQuery} ${messageToSend}`;
        
        const enhancedMessage: Message = {
          text: `✅ Información adicional añadida. Iniciando búsqueda mejorada...`,
          sender: 'bot',
          type: 'chat',
        };
        setMessages(prev => [...prev, enhancedMessage]);
        
        await handleSearchFromPDF(enhancedQuery);
        return;
      }
    }

    setIsLoading(true);
    setSearchProgress(null);

    try {
      // Check if this is a brand collaboration query
      const collaborationMatch = detectCollaborationQuery(messageToSend);
      if (collaborationMatch) {
        const { influencer, brand } = collaborationMatch;
        
        const checkingMessage: Message = {
          text: `🔍 Revisando si ${influencer} ha trabajado con ${brand} anteriormente...`,
          sender: 'bot',
          type: 'chat',
        };
        setMessages(prev => [...prev, checkingMessage]);
        
        await handleCollaborationCheck(influencer, brand);
        return;
      }

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
          stage: '🎉 ¡Búsqueda completada exitosamente!',
          progress: 100,
          details: `Encontrados ${response.data?.data?.totalFound || 0} influencers perfectos para tu campaña`,
          isComplete: true
        });

        // Clear progress after a longer delay to make it more obvious
        setTimeout(() => {
          setSearchProgress(null);
          // Auto-scroll to results after progress clears
          setTimeout(() => {
            const resultsElement = document.querySelector('[data-testid="influencer-results"]');
            if (resultsElement) {
              resultsElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
              });
            }
          }, 300);
        }, 3000);

        let botResponse: Message;
        if (response.type === 'search') {
          // Access the search data properly - it's nested in response.data.data
          const searchData = response.data?.data || response.data;
          const totalFound = searchData?.totalFound || 0;
          
          botResponse = {
            text: `🎯 ¡BÚSQUEDA COMPLETADA! 🎯\n\n✅ Encontré ${totalFound} influencers perfectamente alineados con tus criterios\n\n📊 Los resultados están ordenados por compatibilidad de marca\n🔍 Revisa los perfiles a continuación para encontrar las mejores opciones\n\n💡 Todos los influencers han sido automáticamente guardados en tu campaña`,
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
        {/* PDF Upload Area */}
        {uploadedFile && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">{uploadedFile.name}</div>
                  <div className="text-xs text-blue-600">
                    {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                    {analysisResult && <span className="ml-2">✅ Analizado</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={removePDFFile}
                className="p-1 text-blue-400 hover:text-blue-600"
                disabled={isAnalyzing}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={uploadedFile && analysisResult ? "Haz preguntas de seguimiento o refina la búsqueda..." : "Pídeme que encuentre influencers o sube un PDF..."}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-gray-50 focus:bg-white transition-colors"
              rows={2}
              disabled={isLoading || isAnalyzing}
            />
          </div>
          
          {/* PDF Upload Button */}
          <button
            onClick={handlePDFUploadClick}
            disabled={isLoading || isAnalyzing}
            className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            title="Subir propuesta PDF"
          >
            <Upload className="w-5 h-5" />
          </button>
          
          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || isAnalyzing}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* PDF Upload Hint */}
        {!uploadedFile && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              💡 <strong>Nuevo:</strong> Sube una propuesta PDF para búsquedas ultra-personalizadas
            </p>
          </div>
        )}

        {/* Start Search Button - appears after PDF analysis */}
        {readyToSearch && (
          <div className="mt-3">
            <button
              onClick={handleStartSearchFromPDF}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isLoading ? 'Buscando...' : 'Iniciar Búsqueda'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 