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
  onPDFAnalyzed?: (analysis: any) => void;
}

// Helper function to detect brand collaboration queries
function detectCollaborationQuery(message: string): { influencer: string; brand: string } | null {
  const lowerMessage = message.toLowerCase();
  
  // Enhanced patterns to detect collaboration queries
  const patterns = [
    // Standard format: "Has X worked with Y" / "Ha X trabajado con Y"
    /(?:has|ha)\s+(@?\w+)\s+(?:worked|trabajado)\s+(?:with|con)\s+(@?\w+)/i,
    /(@?\w+)\s+(?:ha\s+trabajado|worked)\s+(?:con|with)\s+(@?\w+)/i,
    
    // Collaboration format: "X collaborated with Y" / "X colaborado con Y"
    /(?:colaborado|collaborated)\s+(@?\w+)\s+(?:con|with)\s+(@?\w+)/i,
    /(@?\w+)\s+(?:colaborado|collaborated)\s+(?:con|with)\s+(@?\w+)/i,
    
    // "X and Y" collaboration format
    /(@?\w+)\s+(?:and|y)\s+(@?\w+)\s*(?:collaboration|colaboraci[oó]n)?/i,
    /(?:collaboration|colaboraci[oó]n)\s*(?:between|entre)\s+(@?\w+)\s+(?:and|y)\s+(@?\w+)/i,
    
    // Direct brand mention: "Cristiano Binance" / "Binance Cristiano"
    /(@?(?:cristiano|ronaldo))\s+(@?\w+)(?:\s+(?:collaboration|colaboraci[oó]n|work|trabajo))?/i,
    /(@?\w+)\s+(@?(?:cristiano|ronaldo))(?:\s+(?:collaboration|colaboraci[oó]n|work|trabajo))?/i,
    
    // Question format: "Did X work with Y?" / "¿X trabajó con Y?"
    /(?:did|¿)\s*(@?\w+)\s+(?:work|trabajar?)\s+(?:with|con)\s+(@?\w+)/i,
    
    // Mention/partnership format
    /(@?\w+)\s+(?:mentioned|mencionó|mencionado)\s+(@?\w+)/i,
    /(?:partnership|alianza)\s+(?:between|entre)\s+(@?\w+)\s+(?:and|y)\s+(@?\w+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      let influencer = match[1].replace('@', '').toLowerCase();
      let brand = match[2].replace('@', '').toLowerCase();
      
      // Handle specific known influencers
      if (influencer === 'ronaldo') influencer = 'cristiano';
      if (brand === 'ronaldo') brand = 'cristiano';
      
      // If one is a known influencer and the other isn't, assume correct order
      const knownInfluencers = ['cristiano', 'messi', 'neymar', 'kyliejenner', 'selenagomez'];
      const knownBrands = ['binance', 'nike', 'adidas', 'coca', 'pepsi', 'mcdonalds', 'ikea'];
      
      if (knownBrands.includes(influencer) && knownInfluencers.includes(brand)) {
        // Swap if we detected them in wrong order
        [influencer, brand] = [brand, influencer];
      }
      
      return { influencer, brand };
    }
  }
  
  return null;
}

// Constants for session storage
const CHAT_MESSAGES_KEY = 'influencer_chat_messages';
const WELCOME_MESSAGE: Message = {
      text: "¡Hola! Soy tu asistente de IA para encontrar influencers. Puedes:\n\n🔍 Escribir tu búsqueda: 'Encuentra influencers de moda en Instagram'\n📄 Subir una propuesta PDF para búsqueda personalizada\n🤝 Preguntar sobre colaboraciones: '¿Ha trabajado Cristiano con IKEA?'\n💡 Hacer preguntas de seguimiento para refinar resultados\n\n¿Cómo te gustaría empezar?",
      sender: 'bot',
      type: 'chat',
};

// Helper functions for session persistence
const loadMessagesFromSession = (): Message[] => {
  if (typeof window === 'undefined') return [WELCOME_MESSAGE];
  
  try {
    const savedMessages = sessionStorage.getItem(CHAT_MESSAGES_KEY);
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      // Ensure we always have at least the welcome message
      return parsed.length > 0 ? parsed : [WELCOME_MESSAGE];
    }
  } catch (error) {
    console.warn('Error loading chat messages from session:', error);
  }
  
  return [WELCOME_MESSAGE];
};

const saveMessagesToSession = (messages: Message[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.warn('Error saving chat messages to session:', error);
  }
};

export function Chatbot({ onSendMessage, onPDFAnalyzed }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>(loadMessagesFromSession);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchProgress, setSearchProgress] = useState<SearchProgress | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [awaitingAdditionalInfo, setAwaitingAdditionalInfo] = useState(false);
  const [readyToSearch, setReadyToSearch] = useState(false);
  const [activeCollaborationCheck, setActiveCollaborationCheck] = useState<{
    influencer: string;
    brand: string;
    abortController: AbortController;
  } | null>(null);
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

  // Save messages to session storage whenever they change
  useEffect(() => {
    saveMessagesToSession(messages);
  }, [messages]);

  // Handle tab visibility changes to prevent search cancellation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeCollaborationCheck) {
        console.log('🔄 Tab became visible again, collaboration check still running...');
        // Optionally show a message that the search is still running
        if (isLoading && searchProgress) {
          const statusMessage: Message = {
            text: `🔄 Tu consulta sobre ${activeCollaborationCheck.influencer} y ${activeCollaborationCheck.brand} sigue procesándose en segundo plano...`,
            sender: 'bot',
            type: 'chat',
          };
          setMessages(prev => {
            // Only add if not already present
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.text !== statusMessage.text) {
              return [...prev, statusMessage];
            }
            return prev;
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeCollaborationCheck, isLoading, searchProgress]);

  // Cleanup active collaboration check on unmount
  useEffect(() => {
    return () => {
      if (activeCollaborationCheck) {
        activeCollaborationCheck.abortController.abort();
        setActiveCollaborationCheck(null);
      }
    };
  }, []);

  // Function to manually cancel active collaboration check
  const cancelCollaborationCheck = () => {
    if (activeCollaborationCheck) {
      activeCollaborationCheck.abortController.abort();
      setActiveCollaborationCheck(null);
      setIsLoading(false);
      setSearchProgress(null);
      
      const cancelMessage: Message = {
        text: `🛑 Verificación cancelada manualmente para ${activeCollaborationCheck.influencer} y ${activeCollaborationCheck.brand}.`,
        sender: 'bot',
        type: 'chat',
      };
      setMessages(prev => [...prev, cancelMessage]);
    }
  };

  // Function to clear chat history and start fresh
  const clearChatHistory = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CHAT_MESSAGES_KEY);
    }
    setMessages([WELCOME_MESSAGE]);
    setUploadedFile(null);
    setAnalysisResult(null);
    setAwaitingAdditionalInfo(false);
    setReadyToSearch(false);
    
    // Cancel any active collaboration check
    if (activeCollaborationCheck) {
      activeCollaborationCheck.abortController.abort();
      setActiveCollaborationCheck(null);
    }
    setIsLoading(false);
    setSearchProgress(null);
  };

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
          text: `✅ ¡Análisis completado! Detecté:\n\n${formatAnalysisForDisplay(result.analysis)}\n\n💡 **Puedes hacer refinamientos ahora via chat:**\n• "Solo influencers masculinos"\n• "Enfoque en lifestyle/moda"\n• "Mínimo 100k seguidores"\n• Cualquier otra especificación\n\n🎯 Todos tus refinamientos se incluirán automáticamente cuando hagas click en "Iniciar Búsqueda"`,
          sender: 'bot',
          type: 'chat',
        };
        setMessages(prev => [...prev, analysisMessage]);

        if (onPDFAnalyzed) {
          onPDFAnalyzed(result.analysis);
        }

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
    
    // Get the base search query from PDF analysis
    const baseQuery = generateSearchFromAnalysis(analysisResult);
    
    // Find user refinements made after PDF analysis
    const pdfAnalysisIndex = messages.findIndex(msg => 
      msg.text.includes('✅ ¡Análisis completado!') && msg.sender === 'bot'
    );
    
    const userRefinements = messages
      .slice(pdfAnalysisIndex + 1)
      .filter(msg => msg.sender === 'user' && msg.type === 'chat')
      .map(msg => msg.text)
      .join(' ');
    
    // Combine base query with user refinements
    const finalSearchQuery = userRefinements 
      ? `${baseQuery}. Refinamientos adicionales: ${userRefinements}`
      : baseQuery;
    
    const searchMessage: Message = {
      text: userRefinements 
        ? `🔍 Iniciando búsqueda personalizada basada en tu propuesta PDF + refinamientos del chat:\n\n📄 **Base PDF**: ${baseQuery}\n💬 **Refinamientos**: ${userRefinements}\n\n🎯 Combinando todo para encontrar los influencers perfectos...`
        : '🔍 Iniciando búsqueda personalizada basada en tu propuesta...',
      sender: 'bot',
      type: 'chat',
    };
    setMessages(prev => [...prev, searchMessage]);
    
    await handleSearchFromPDF(finalSearchQuery);
  };

  const handleCollaborationCheck = async (influencer: string, brand: string) => {
    // Check if there's already an active collaboration check
    if (activeCollaborationCheck) {
      const statusMessage: Message = {
        text: `⚠️ Ya hay una verificación en curso para ${activeCollaborationCheck.influencer} y ${activeCollaborationCheck.brand}. Por favor espera a que termine.`,
        sender: 'bot',
        type: 'chat',
      };
      setMessages(prev => [...prev, statusMessage]);
      return;
    }

    // Create a persistent AbortController that won't be cancelled by tab switches
    const abortController = new AbortController();
    
    // Set active collaboration check
    setActiveCollaborationCheck({
      influencer,
      brand,
      abortController
    });

    try {
      // Start progress tracking for collaboration checks
      setSearchProgress({
        stage: 'Iniciando verificación...',
        progress: 10,
        details: 'Preparando análisis de colaboración',
        isComplete: false
      });

      // Simulate progress updates during collaboration check
      let currentStage = 0;
      const stages = [
        { stage: 'Accediendo al perfil...', details: 'Conectando con Instagram API', duration: 5000, endProgress: 25 },
        { stage: 'Descargando publicaciones...', details: 'Extrayendo posts recientes del influencer', duration: 45000, endProgress: 60 },
        { stage: 'Buscando en web...', details: 'Verificando colaboraciones en artículos y noticias', duration: 20000, endProgress: 80 },
        { stage: 'Analizando contenido...', details: 'Buscando menciones y colaboraciones', duration: 10000, endProgress: 90 },
        { stage: 'Verificando evidencias...', details: 'Calculando nivel de confianza', duration: 8000, endProgress: 95 },
        { stage: 'Finalizando análisis...', details: 'Preparando reporte de colaboración', duration: 5000, endProgress: 98 }
      ];

      const progressInterval = setInterval(() => {
        setSearchProgress(prev => {
          if (!prev || currentStage >= stages.length) return prev;
          
          const stage = stages[currentStage];
          const increment = (stage.endProgress - (currentStage > 0 ? stages[currentStage - 1].endProgress : 10)) / (stage.duration / 1000);
          
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

      // Make the fetch request with the persistent AbortController
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
        signal: abortController.signal, // Use the persistent signal
        // Add keepalive to help prevent cancellation on tab switch
        keepalive: true
      });

      // Clear progress interval
      clearInterval(progressInterval);
      
      // Complete the progress
      setSearchProgress({
        stage: 'Análisis completado',
        progress: 100,
        details: 'Reporte de colaboración listo',
        isComplete: true
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Check if response format is valid
      if (!result || typeof result !== 'object') {
        console.error('❌ Unexpected response type:', result);
        throw new Error('Respuesta inválida del servidor');
      }

      if (!result.success) {
        throw new Error(result.error || 'Error en la verificación de colaboración');
      }

      // Handle the API response - note the correct property names
      const collaboration = result.collaboration;
      if (!collaboration) {
        throw new Error('Datos de colaboración no encontrados en la respuesta');
      }

      let responseText = '';
      // Use the correct property name from API: hasWorkedTogether instead of hasCollaborated
      if (collaboration.hasWorkedTogether) {
        const { collaborationType, evidence, confidence, lastCollabDate } = collaboration;
        
        if (collaborationType === 'partnership') {
          responseText = `✅ **SÍ, ${influencer.toUpperCase()} ha trabajado con ${brand.toUpperCase()}**\n\n🤝 **Tipo**: Colaboración comercial confirmada\n🎯 **Confianza**: ${confidence}%`;
          if (lastCollabDate) {
            responseText += `\n📅 **Última colaboración**: ${lastCollabDate}`;
          }
        } else if (collaborationType === 'mention') {
          responseText = `✅ **SÍ, ${influencer.toUpperCase()} ha mencionado ${brand.toUpperCase()}**\n\n💬 **Tipo**: Mención de marca\n🎯 **Confianza**: ${confidence}%`;
          if (lastCollabDate) {
            responseText += `\n📅 **Última mención**: ${lastCollabDate}`;
          }
        }

        if (evidence && evidence.length > 0) {
          responseText += `\n\n📝 **Evidencia encontrada**:\n${evidence.map((e: string) => `• ${e}`).join('\n')}`;
        }

        // Add verification methods info
        if (result.verificationMethods) {
          responseText += `\n\n🔍 **Verificado via**: ${result.verificationMethods.join(' y ')}`;
        }
      } else {
        responseText = `❌ **NO, ${influencer.toUpperCase()} no ha trabajado con ${brand.toUpperCase()}**\n\n🔍 **Análisis**: Revisé ${result.postsAnalyzed || 20} publicaciones recientes\n📊 **Resultado**: Sin colaboraciones o menciones detectadas`;
        
        if (result.fallbackMethod) {
          responseText += `\n\n⚠️ **Nota**: Análisis realizado via ${result.fallbackMethod === 'bio-analysis' ? 'biografía del perfil' : 'método alternativo'}`;
        }

        if (result.verificationMethods) {
          responseText += `\n\n🔍 **Métodos verificados**: ${result.verificationMethods.join(', ')}`;
        }
      }

      const collaborationResponse: Message = {
        text: responseText,
        sender: 'bot',
        type: 'chat',
      };

      setMessages(prev => [...prev, collaborationResponse]);

    } catch (error) {
      console.error('Error checking collaboration:', error);
      
      // Clear any running progress
      setSearchProgress(null);
      
      // Check if the error was due to abort (user cancellation)
      if (error instanceof Error && error.name === 'AbortError') {
        const cancelMessage: Message = {
          text: `🛑 Verificación cancelada para ${influencer} y ${brand}.`,
          sender: 'bot',
          type: 'chat',
        };
        setMessages(prev => [...prev, cancelMessage]);
      } else {
      const errorMessage: Message = {
          text: `❌ Error al verificar la colaboración entre ${influencer} y ${brand}. ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, inténtalo de nuevo.`,
        sender: 'bot',
        type: 'chat',
      };
      setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      // Clear the active collaboration check
      setActiveCollaborationCheck(null);
      // Ensure progress is cleared after a delay
      setTimeout(() => setSearchProgress(null), 2000);
    }
  };

  // Function to parse natural language search queries into structured parameters
  const parseSearchQuery = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // Extract location
    const locationMatch = lowerQuery.match(/(?:from|in|de|en)\s+([a-zA-Z\s]+?)(?:\s+for|\s+brand|\s+male|\s+female|\s+influencers?|\s*$)/);
    const location = locationMatch ? locationMatch[1].trim() : undefined;
    
    // Extract gender
    let gender: 'male' | 'female' | 'any' | undefined;
    if (lowerQuery.includes('female only') || lowerQuery.includes('women only') || lowerQuery.includes('mujeres')) {
      gender = 'female';
    } else if (lowerQuery.includes('male only') || lowerQuery.includes('men only') || lowerQuery.includes('masculinos') || lowerQuery.includes('hombres')) {
      gender = 'male';
    }
    
    // Extract brand name
    const brandMatch = lowerQuery.match(/(?:for|para)\s+([a-zA-Z0-9]+)\s+brand/);
    const brandName = brandMatch ? brandMatch[1].trim() : undefined;
    
    // Extract niches/categories
    const niches: string[] = [];
    if (lowerQuery.includes('lifestyle')) niches.push('lifestyle');
    if (lowerQuery.includes('fashion') || lowerQuery.includes('moda')) niches.push('fashion');
    if (lowerQuery.includes('fitness') || lowerQuery.includes('health')) niches.push('fitness');
    if (lowerQuery.includes('food') || lowerQuery.includes('cooking')) niches.push('food');
    if (lowerQuery.includes('beauty') || lowerQuery.includes('belleza')) niches.push('beauty');
    if (lowerQuery.includes('travel') || lowerQuery.includes('viaje')) niches.push('travel');
    if (lowerQuery.includes('gaming') || lowerQuery.includes('juegos')) niches.push('gaming');
    if (lowerQuery.includes('tech') || lowerQuery.includes('technology')) niches.push('technology');
    
    // Extract platforms
    const platforms: string[] = [];
    if (lowerQuery.includes('instagram') || lowerQuery.includes('ig')) platforms.push('Instagram');
    if (lowerQuery.includes('tiktok') || lowerQuery.includes('tik tok')) platforms.push('TikTok');
    if (lowerQuery.includes('youtube') || lowerQuery.includes('yt')) platforms.push('YouTube');
    if (platforms.length === 0) platforms.push('Instagram', 'TikTok'); // Default platforms
    
    // Extract follower ranges
    let minFollowers: number | undefined;
    let maxFollowers: number | undefined;
    
    const followerMatch = lowerQuery.match(/(?:min|minimum|mínimo)\s*(\d+(?:k|m)?)/);
    if (followerMatch) {
      const value = followerMatch[1];
      if (value.includes('k')) {
        minFollowers = parseInt(value.replace('k', '')) * 1000;
      } else if (value.includes('m')) {
        minFollowers = parseInt(value.replace('m', '')) * 1000000;
      } else {
        minFollowers = parseInt(value);
      }
    }
    
    return {
      userQuery: query,
      location,
      gender,
      brandName,
      niches: niches.length > 0 ? niches : undefined,
      platforms,
      minFollowers,
      maxFollowers,
      enableSpanishDetection: true,
      enableAgeEstimation: true,
      maxResults: 50
    };
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
        // Parse the natural language query into structured parameters
        const searchParams = parseSearchQuery(messageToSend);
        
        // Show user what was parsed for transparency
        const parsedDetails = [];
        if (searchParams.location) parsedDetails.push(`📍 Ubicación: ${searchParams.location}`);
        if (searchParams.gender) parsedDetails.push(`👤 Género: ${searchParams.gender === 'female' ? 'Femenino' : 'Masculino'}`);
        if (searchParams.brandName) parsedDetails.push(`🏢 Marca: ${searchParams.brandName}`);
        if (searchParams.niches) parsedDetails.push(`🎯 Nichos: ${searchParams.niches.join(', ')}`);
        if (searchParams.platforms) parsedDetails.push(`📱 Plataformas: ${searchParams.platforms.join(', ')}`);
        if (searchParams.minFollowers) parsedDetails.push(`👥 Min seguidores: ${searchParams.minFollowers.toLocaleString()}`);
        
        if (parsedDetails.length > 0) {
          const parsedMessage: Message = {
            text: `🎯 **Criterios de búsqueda detectados:**\n\n${parsedDetails.join('\n')}\n\n🔍 Iniciando búsqueda personalizada...`,
            sender: 'bot',
            type: 'chat',
          };
          setMessages(prev => [...prev, parsedMessage]);
        }

        // Start REAL-TIME progress tracking with streaming API
        setSearchProgress({
          stage: 'Iniciando búsqueda...',
          progress: 5,
          details: 'Conectando con servicios de búsqueda',
          isComplete: false
        });

        try {
          // Use the progressive loading API with streaming
          const response = await fetch('/api/enhanced-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
            },
            body: JSON.stringify(searchParams),
          });

          if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let partialResults: any[] = [];
            let finalResults: any = null;
            let buffer = ''; // 🔥 NEW: Buffer for incomplete chunks

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              buffer += chunk; // 🔥 FIXED: Accumulate chunks
              
              // 🔥 FIXED: Process complete lines only
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith('data: ') && line.trim() !== 'data: ') {
                  try {
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr) { // 🔥 FIXED: Only parse non-empty JSON
                      const data = JSON.parse(jsonStr);
                      
                      if (data.type === 'progress') {
                        // Update progress bar with real-time status
                        setSearchProgress({
                          stage: data.stage,
                          progress: data.progress,
                          details: data.stage,
                          isComplete: false
                        });
                      } else if (data.type === 'partial_results') {
                        // Show partial results immediately
                        partialResults.push(...(data.results || []));
                        
                        setSearchProgress({
                          stage: data.stage,
                          progress: data.progress,
                          details: `${partialResults.length} influencers encontrados hasta ahora...`,
                          isComplete: false
                        });

                        // Trigger parent to show partial results
                        if (partialResults.length > 0) {
                          await onSendMessage(`PARTIAL_RESULTS:${JSON.stringify({
                            premiumResults: partialResults,
                            totalFound: partialResults.length,
                            searchSources: [data.metadata?.source || 'streaming'],
                            partial: true
                          })}`, messages);
                        }
                      } else if (data.type === 'complete') {
                        // Final results
                        finalResults = {
                          premiumResults: data.results || [],
                          totalFound: data.totalFound || 0,
                          searchSources: data.metadata?.searchSources || [],
                          searchStrategy: data.metadata?.searchStrategy || 'streaming'
                        };
                        
                        setSearchProgress({
                          stage: '🎉 ¡Búsqueda completada exitosamente!',
                          progress: 100,
                          details: `${finalResults.totalFound} influencers encontrados`,
                          isComplete: true
                        });
                      }
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse streaming data:', parseError);
                    // 🔥 IMPROVED: Log the problematic line for debugging
                    console.warn('Problematic line:', line);
                  }
                }
              }
            }

            // Send final results to parent
            if (finalResults) {
              const response = await onSendMessage(`STRUCTURED_SEARCH:${JSON.stringify(searchParams)}`, messages);
              
              const botResponse: Message = {
                text: `🎯 ¡BÚSQUEDA EN TIEMPO REAL COMPLETADA! 🎯\n\n✅ Encontré ${finalResults.totalFound} influencers perfectamente alineados\n\n📊 Resultados mostrados en tiempo real usando búsqueda streaming\n🔍 Los perfiles se ordenaron automáticamente por compatibilidad\n\n💡 Búsqueda mejorada con IA y verificación en tiempo real`,
                sender: 'bot',
                type: 'search',
              };
              setMessages(prev => [...prev, botResponse]);
            }

          } else {
            // Fallback to regular API if streaming not supported
            console.log('🔄 Streaming not supported, falling back to regular search...');
            const structuredQuery = `STRUCTURED_SEARCH:${JSON.stringify(searchParams)}`;
            const response = await onSendMessage(structuredQuery, messages);
            
            setSearchProgress({
              stage: '🎉 ¡Búsqueda completada!',
              progress: 100,
              details: `Encontrados ${response.data?.data?.totalFound || 0} influencers`,
              isComplete: true
            });

            const botResponse: Message = {
              text: `🎯 ¡BÚSQUEDA COMPLETADA! 🎯\n\n✅ Encontré ${response.data?.data?.totalFound || 0} influencers alineados con tus criterios\n\n📊 Los resultados están ordenados por compatibilidad de marca`,
              sender: 'bot',
              type: 'search',
            };
            setMessages(prev => [...prev, botResponse]);
          }

        } catch (streamError) {
          console.error('Streaming search failed:', streamError);
          
          // Fallback to regular search
          const structuredQuery = `STRUCTURED_SEARCH:${JSON.stringify(searchParams)}`;
          const response = await onSendMessage(structuredQuery, messages);
          
          setSearchProgress({
            stage: '✅ Búsqueda completada (modo estándar)',
            progress: 100,
            details: `${response.data?.data?.totalFound || 0} influencers encontrados`,
            isComplete: true
          });

          const botResponse: Message = {
            text: `🎯 ¡BÚSQUEDA COMPLETADA! 🎯\n\n✅ Encontré ${response.data?.data?.totalFound || 0} influencers\n\n📊 Resultados ordenados por compatibilidad`,
            sender: 'bot',
            type: 'search',
          };
          setMessages(prev => [...prev, botResponse]);
        }

        // Clear progress after delay
        setTimeout(() => {
          setSearchProgress(null);
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
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Asistente de IA para Influencers</h2>
            <p className="text-blue-100 text-sm">Encuentra los creadores perfectos para tus campañas</p>
          </div>
          </div>
          
          {/* Clear Chat Button */}
          {messages.length > 1 && (
            <button
              onClick={clearChatHistory}
              className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1"
              title="Limpiar conversación"
            >
              <X className="w-4 h-4" />
              <span>Limpiar</span>
            </button>
          )}
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
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-600">{Math.round(searchProgress.progress)}%</span>
                    {searchProgress.isComplete && <span className="text-green-500 text-sm">✅</span>}
                    {/* Cancel button for active collaboration checks */}
                    {activeCollaborationCheck && !searchProgress.isComplete && (
                      <button
                        onClick={cancelCollaborationCheck}
                        className="text-red-500 hover:text-red-700 text-xs font-medium underline ml-2"
                        title="Cancelar verificación"
                      >
                        Cancelar
                      </button>
                    )}
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

      {/* Compact Suggested Prompts - Only show until first user message */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="text-xs text-gray-600 mb-1.5 font-medium">💡 Prueba estas búsquedas:</div>
          <div className="flex gap-2 overflow-x-auto">
            {[
              { text: "🎯 Influencers fitness Madrid", icon: "🎯" },
              { text: "👩 Beauty +50K seguidores", icon: "👩" },
              { text: "🔍 ¿Cristiano con IKEA?", icon: "🔍" },
              { text: "📄 Subir PDF", icon: "📄" }
            ].map((prompt, index) => (
              <button
                key={index}
                onClick={() => {
                  if (prompt.text.includes("PDF")) {
                    handlePDFUploadClick();
                  } else {
                    setInputMessage(prompt.text.substring(2)); // Remove emoji prefix
                    // Auto-focus input after setting message
                    setTimeout(() => {
                      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                      if (textarea) {
                        textarea.focus();
                        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                      }
                    }, 100);
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-gray-700 hover:text-blue-700 whitespace-nowrap flex-shrink-0"
              >
                <span>{prompt.icon}</span>
                <span>{prompt.text.substring(2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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

        {/* Session Persistence Indicator */}
        {messages.length > 1 && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center space-x-1">
              <span>💾</span>
              <span>Tu conversación se guarda durante esta sesión</span>
            </p>
          </div>
        )}

        {/* Start Search Button - appears after PDF analysis */}
        {readyToSearch && (
          <div className="mt-3 space-y-2">
            {/* Show preview of what will be searched */}
            {(() => {
              const baseQuery = analysisResult ? generateSearchFromAnalysis(analysisResult) : '';
              const pdfAnalysisIndex = messages.findIndex(msg => 
                msg.text.includes('✅ ¡Análisis completado!') && msg.sender === 'bot'
              );
              const userRefinements = messages
                .slice(pdfAnalysisIndex + 1)
                .filter(msg => msg.sender === 'user' && msg.type === 'chat')
                .map(msg => msg.text)
                .join(' ');
              
              return userRefinements ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <div className="font-medium text-blue-900 mb-2">🎯 Vista previa de búsqueda:</div>
                  <div className="text-blue-800">
                    <div><strong>PDF Base:</strong> {baseQuery}</div>
                    <div className="mt-1"><strong>+ Refinamientos:</strong> {userRefinements}</div>
                  </div>
                </div>
              ) : null;
            })()}
            
            <button
              onClick={handleStartSearchFromPDF}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isLoading ? 'Buscando...' : 'Iniciar Búsqueda Completa'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 