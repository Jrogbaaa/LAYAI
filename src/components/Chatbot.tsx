'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

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
  
  // First, check if this is clearly a search query - if so, don't attempt collaboration detection
  const searchKeywords = ['find', 'search', 'show', 'get', 'look for', 'discover', 'recommend', 'buscar', 'encontrar', 'mostrar', 'busca', 'encuentra', 'muestra', 'recomendar', 'descubrir'];
  const hasSearchKeywords = searchKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasInfluencerKeywords = lowerMessage.includes('influencer') || lowerMessage.includes('creator') || lowerMessage.includes('creador') || lowerMessage.includes('creadores');
  
  // Age-related patterns that should NOT trigger collaboration checks
  const agePatterns = [
    /ages?\s+\d+/gi,
    /\d+\s+(?:and|y)\s+(?:over|under|above|below|más|menos)/gi,
    /(?:over|under|above|below|más|menos)\s+\d+/gi,
    /\d+\s*-\s*\d+\s*(?:years?|años?)/gi,
    /\d+k?\s+(?:followers?|seguidores?)/gi
  ];
  
  const hasAgePatterns = agePatterns.some(pattern => pattern.test(message));
  
  // If it's clearly a search query or has age patterns, don't try collaboration detection
  if (hasSearchKeywords || hasInfluencerKeywords || hasAgePatterns) {
    return null;
  }
  
  // Only proceed with collaboration detection if we have explicit collaboration keywords
  const collaborationKeywords = [
    'check collaboration', 'verify collaboration', 'brand collaboration', 'worked with',
    'collaborated with', 'partnership with', 'sponsored by', 'brand ambassador',
    'collaboration history', 'brand partnership',
    'verificar colaboración', 'verificar colaboracion', 'colaboró con', 'colaboro con',
    'trabajó con', 'trabajo con', 'patrocinado por', 'embajador de',
    'collaboration check', 'partnership check', 'mentioned', 'ever mentioned'
  ];
  
  const hasCollaborationKeywords = collaborationKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (!hasCollaborationKeywords) {
    return null;
  }
  
  // Enhanced patterns to detect collaboration queries - only proceed if we have collaboration keywords
  const patterns = [
    // Standard format: "Has X worked with Y" / "Ha X trabajado con Y"
    /(?:has|ha)\s+(@?[a-zA-Z][a-zA-Z0-9._]+)\s+(?:worked|trabajado)\s+(?:with|con)\s+(@?[a-zA-Z][a-zA-Z0-9._]+)/i,
    /(@?[a-zA-Z][a-zA-Z0-9._]+)\s+(?:ha\s+trabajado|worked)\s+(?:con|with)\s+(@?[a-zA-Z][a-zA-Z0-9._]+)/i,
    
    // Collaboration format: "X collaborated with Y" / "X colaborado con Y"
    /(?:colaborado|collaborated)\s+(@?[a-zA-Z][a-zA-Z0-9._]+)\s+(?:con|with)\s+(@?[a-zA-Z][a-zA-Z0-9._]+)/i,
    /(@?[a-zA-Z][a-zA-Z0-9._]+)\s+(?:colaborado|collaborated)\s+(?:con|with)\s+(@?[a-zA-Z][a-zA-Z0-9._]+)/i,
    
    // Question format: "Did X work with Y?" / "¿X trabajó con Y?"
    /(?:did|¿)\s*(@?[a-zA-Z][a-zA-Z0-9._]+)\s+(?:work|trabajar?)\s+(?:with|con)\s+(@?[a-zA-Z][a-zA-Z0-9._]+)/i,
    
    // Check/verify format
    /(?:check|verify|verifica)\s+(?:if\s+)?(@?[a-zA-Z][a-zA-Z0-9._]+)\s+(?:worked|colaboró|mentioned)\s+(?:with|con)\s+(@?[a-zA-Z][a-zA-Z0-9._]+)/i,
    
    // Mention/partnership format - but require explicit mention context
    /(?:has\s+)?(@?[a-zA-Z][a-zA-Z0-9._]+)\s+(?:mentioned|mencionó|ever\s+mentioned)\s+(@?[a-zA-Z][a-zA-Z0-9._]+)/i,
  ];
  
  // Invalid words that should not be treated as influencers or brands
  const invalidWords = [
    /^\d+$/, // Pure numbers
    /^over$/i, /^under$/i, /^above$/i, /^below$/i,
    /^and$/i, /^or$/i, /^the$/i, /^a$/i, /^an$/i,
    /^ages?$/i, /^years?$/i, /^old$/i,
    /^men$/i, /^women$/i, /^male$/i, /^female$/i,
    /^only$/i, /^from$/i, /^in$/i, /^for$/i,
    /^followers?$/i, /^seguidores?$/i,
    /^más$/i, /^menos$/i, /^y$/i, /^with$/i, /^con$/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      let influencer = match[1].replace('@', '').toLowerCase();
      let brand = match[2].replace('@', '').toLowerCase();
      
      // Validate that neither is an invalid word
      const influencerInvalid = invalidWords.some(invalidPattern => invalidPattern.test(influencer));
      const brandInvalid = invalidWords.some(invalidPattern => invalidPattern.test(brand));
      
      if (influencerInvalid || brandInvalid) {
        continue; // Skip this match and try next pattern
      }
      
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
      
      // Only return if both names are meaningful (more than 1 character and not invalid)
      if (influencer.length > 1 && brand.length > 1) {
      return { influencer, brand };
      }
    }
  }
  
  return null;
}

// Function to detect profile-based similarity search queries
function detectProfileSimilarityQuery(message: string): { profileDescription: string } | null {
  const lowerMessage = message.toLowerCase();
  
  // Keywords that indicate profile similarity search
  const similarityKeywords = [
    'find similar', 'similar to', 'like this profile', 'profiles like', 'influencers like',
    'similar profiles', 'find influencers similar', 'match this profile', 'similar influencer',
    'find matches', 'similar creators', 'profiles similar', 'find similar influencers',
    'similar to this', 'influencers similar to', 'creators similar to', 'like this influencer',
    'find people like', 'similar people', 'profiles matching', 'matching profiles'
  ];
  
  const hasProfileKeywords = similarityKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Profile description indicators
  const profileIndicators = [
    'here\'s a profile', 'heres a profile', 'profile:', 'here is a profile',
    'this profile', 'this influencer', 'this creator', 'description:',
    'profile description', 'influencer description', 'creator description'
  ];
  
  const hasProfileIndicators = profileIndicators.some(indicator => lowerMessage.includes(indicator));
  
  // Detailed profile markers (indicates someone is describing an influencer in detail)
  const detailMarkers = [
    'followers', 'instagram', 'known for', 'famous for', 'profession:', 'nationality:',
    'specializes in', 'expert in', 'content creator', 'social media influencer',
    'million followers', 'k followers', 'engagement', 'brand ambassador'
  ];
  
  const hasDetailMarkers = detailMarkers.filter(marker => lowerMessage.includes(marker)).length >= 2;
  
  // Long message with profile-like content (likely a description)
  const isLongMessage = message.length > 200;
  const hasProfileLikeContent = (lowerMessage.includes('influencer') || lowerMessage.includes('creator')) && 
                                (lowerMessage.includes('followers') || lowerMessage.includes('instagram') || lowerMessage.includes('known for'));
  
  // Check if this looks like a profile similarity query
  if (hasProfileKeywords || (hasProfileIndicators && hasDetailMarkers) || 
      (isLongMessage && hasProfileLikeContent) || 
      (hasProfileIndicators && isLongMessage)) {
    
    // Extract the profile description part
    let profileDescription = message;
    
    // Try to extract just the profile part if there are clear markers
    const profileMarkers = [
      /(?:here'?s?\s+a?\s+profile[:\-\s]+)([\s\S]*)/i,
      /(?:profile[:\-\s]+)([\s\S]*)/i,
      /(?:find\s+similar\s+(?:to|profiles?\s+to)[:\-\s]*)([\s\S]*)/i,
      /(?:influencer\s+description[:\-\s]+)([\s\S]*)/i,
      /(?:this\s+(?:profile|influencer|creator)[:\-\s]*)([\s\S]*)/i
    ];
    
    for (const marker of profileMarkers) {
      const match = message.match(marker);
      if (match && match[1] && match[1].trim().length > 50) {
        profileDescription = match[1].trim();
        break;
      }
    }
    
    // Ensure we have a substantial description
    if (profileDescription.length > 50) {
      return { profileDescription: profileDescription.trim() };
    }
  }
  
  return null;
}

// Constants for session storage
const CHAT_MESSAGES_KEY = 'influencer_chat_messages';
const WELCOME_MESSAGE: Message = {
      text: "Hello! I'm your AI assistant for finding influencers. You can:\n\n🔍 Write your search: 'Find fashion influencers on Instagram'\n📄 Upload a PDF proposal for personalized search\n🤝 Ask about collaborations: 'Has Cristiano worked with IKEA?'\n👥 Find similar profiles: 'Here's a profile - find me similar influencers: [description]'\n💡 Ask follow-up questions to refine results\n\nHow would you like to start?",
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
  const { t } = useLanguage();
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
      text: `📄 Uploaded proposal: ${file.name}`,
      sender: 'user',
      type: 'chat',
    };
    setMessages(prev => [...prev, userMessage]);

    // Add bot analyzing message
    const analyzingMessage: Message = {
      text: '🤖 Analyzing your PDF proposal... This may take a few seconds.',
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
          text: `✅ Analysis completed! I detected:\n\n${formatAnalysisForDisplay(result.analysis)}\n\n💡 **You can make refinements now via chat:**\n• "Only male influencers"\n• "Focus on lifestyle/fashion"\n• "Minimum 100k followers"\n• Any other specification\n\n🎯 All your refinements will be automatically included when you click "Start Search"`,
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
    
    if (analysis.brandName) details.push(`🏢 Brand: ${analysis.brandName}`);
    if (analysis.platforms?.length > 0) details.push(`📱 Platforms: ${analysis.platforms.join(', ')}`);
    if (analysis.targetAudience?.ageRange) details.push(`👥 Age: ${analysis.targetAudience.ageRange} years`);
    if (analysis.targetAudience?.location) details.push(`📍 Location: ${analysis.targetAudience.location}`);
    if (analysis.budget?.min && analysis.budget?.max) {
      details.push(`💰 Budget: ${analysis.budget.min}-${analysis.budget.max} ${analysis.budget.currency || 'EUR'}`);
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
          text: `🎯 SEARCH COMPLETED! 🎯\n\n✅ I found ${totalFound} influencers perfectly aligned with your criteria\n\n📊 Results are sorted by brand compatibility\n🔍 Review the profiles below to find the best options\n\n💡 All influencers have been automatically saved to your campaign`,
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

  const handleProfileSimilaritySearch = async (profileDescription: string) => {
    try {
      setIsLoading(true);
      setSearchProgress({
        stage: 'Analyzing profile description',
        progress: 20,
        details: 'Extracting key attributes from the profile...',
        isComplete: false,
      });

      const response = await fetch('/api/profile-similarity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileDescription,
          limit: 10,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search for similar profiles');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Profile similarity search failed');
      }

      setSearchProgress({
        stage: 'Processing results',
        progress: 80,
        details: 'Ranking profiles by similarity...',
        isComplete: false,
      });

      // Create a comprehensive response message
      const { results, extractedAttributes } = result.data;
      
      const attributesSummary = [];
      if (extractedAttributes.profession) attributesSummary.push(`🏢 Profession: ${extractedAttributes.profession}`);
      if (extractedAttributes.nationality) attributesSummary.push(`🌍 Nationality: ${extractedAttributes.nationality}`);
      if (extractedAttributes.niche) attributesSummary.push(`🎯 Niches: ${extractedAttributes.niche.join(', ')}`);
      if (extractedAttributes.platform) attributesSummary.push(`📱 Platforms: ${extractedAttributes.platform.join(', ')}`);
      if (extractedAttributes.followerRange) {
        const min = Math.round(extractedAttributes.followerRange.min / 1000);
        const max = Math.round(extractedAttributes.followerRange.max / 1000);
        attributesSummary.push(`👥 Follower range: ${min}K - ${max}K`);
      }

      const analysisMessage: Message = {
        text: `✅ **Profile Analysis Complete!** 🎯\n\n**Extracted attributes:**\n${attributesSummary.join('\n')}\n\n**Found ${results.length} similar profiles** ranked by compatibility:\n\n🔍 **Results are displayed below** - each profile shows similarity score and match reasons.`,
        sender: 'bot',
        type: 'chat',
      };
      setMessages(prev => [...prev, analysisMessage]);

      // Prepare results for display
      const searchResults = results.map((result: any) => {
        const profile = result.influencer || result;
        return {
          influencer: {
            username: profile.username,
            fullName: profile.fullName || profile.username,
            followers: profile.followers || profile.followerCount,
            platform: profile.platform || 'Instagram',
            engagementRate: profile.engagementRate || 0,
            biography: profile.biography || profile.bio || '',
            profilePicUrl: profile.profilePicUrl || '',
            verified: profile.verified || false,
            category: profile.category || 'lifestyle',
            location: profile.location || '',
            avgLikes: profile.avgLikes || 0,
            avgComments: profile.avgComments || 0,
            collaborationRate: profile.collaborationRate || 0,
            brandCompatibilityScore: result.similarityScore || 0,
          },
          matchReasons: result.matchReasons || [],
          similarityScore: result.similarityScore || 0,
        };
      });

      setSearchProgress({
        stage: 'Complete',
        progress: 100,
        details: `Found ${searchResults.length} similar profiles`,
        isComplete: true,
      });

      // Send to parent component for display
      await onSendMessage(`Profile similarity search completed`, [...messages, analysisMessage]);
      
      // Trigger search results display
      setTimeout(() => {
        const searchCompleteMessage: Message = {
          text: `🎯 **PROFILE SIMILARITY SEARCH COMPLETED!** 🎯\n\n✅ Found ${searchResults.length} profiles with similar characteristics\n\n📊 Results are ranked by compatibility score\n🔍 Review the profiles below to find the best matches\n\n💡 Each profile shows why it matched your description`,
          sender: 'bot',
          type: 'search',
        };
        setMessages(prev => [...prev, searchCompleteMessage]);
      }, 500);

    } catch (error) {
      console.error('❌ Profile similarity search error:', error);
      
      const errorMessage: Message = {
        text: `❌ **Profile similarity search failed**\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n💡 **Try:**\n• Providing more details about the influencer\n• Including follower count, platform, or profession\n• Making sure the description is at least 50 characters long`,
        sender: 'bot',
        type: 'chat',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSearchProgress(null);
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
          text: `🔍 Checking if ${influencer} has worked with ${brand} previously...`,
          sender: 'bot',
          type: 'chat',
        };
        setMessages(prev => [...prev, checkingMessage]);
        
        await handleCollaborationCheck(influencer, brand);
        return;
      }

      // Check if this is a profile similarity query
      const profileSimilarityMatch = detectProfileSimilarityQuery(messageToSend);
      if (profileSimilarityMatch) {
        const { profileDescription } = profileSimilarityMatch;
        
        const analyzingMessage: Message = {
          text: `🔍 Analyzing the profile description to find similar influencers...`,
          sender: 'bot',
          type: 'chat',
        };
        setMessages(prev => [...prev, analyzingMessage]);
        
        await handleProfileSimilaritySearch(profileDescription);
        return;
      }

      // Check if this is likely a search query - enhanced detection
      const lowerMessage = inputMessage.toLowerCase();
      const searchKeywords = ['find', 'search', 'show', 'get', 'look for', 'discover', 'recommend', 'buscar', 'encontrar', 'mostrar', 'busca', 'encuentra', 'muestra', 'recomendar', 'descubrir'];
      const hasSearchKeywords = searchKeywords.some(keyword => lowerMessage.includes(keyword));
      const hasInfluencerKeywords = lowerMessage.includes('influencer') || lowerMessage.includes('creator') || lowerMessage.includes('creador') || lowerMessage.includes('creadores');
      
      // Age-related patterns that indicate search queries
      const agePatterns = [
        /ages?\s+\d+/gi,
        /\d+\s+(?:and|y)\s+(?:over|under|above|below|más|menos)/gi,
        /(?:over|under|above|below|más|menos)\s+\d+/gi,
        /\d+\s*-\s*\d+\s*(?:years?|años?)/gi,
      ];
      
      const hasAgePatterns = agePatterns.some(pattern => pattern.test(inputMessage));
      
      // Platform indicators
      const platformKeywords = ['instagram', 'tiktok', 'youtube', 'twitter', 'ig', 'yt'];
      const hasPlatformKeywords = platformKeywords.some(keyword => lowerMessage.includes(keyword));
      
      // Follower count indicators
      const followerPatterns = [
        /\d+k?\s+(?:followers?|seguidores?)/gi,
        /\d+\s*-\s*\d+k?\s*(?:followers?|seguidores?)/gi,
        /(?:over|under|above|below|más|menos)\s+\d+k?\s*(?:followers?|seguidores?)/gi
      ];
      
      const hasFollowerPatterns = followerPatterns.some(pattern => pattern.test(inputMessage));
      
      // Location indicators
      const locationKeywords = ['from', 'in', 'based in', 'located in', 'en', 'de', 'desde'];
      const hasLocationKeywords = locationKeywords.some(keyword => lowerMessage.includes(keyword));
      
      const isSearchQuery = hasSearchKeywords || hasInfluencerKeywords || hasAgePatterns || hasPlatformKeywords || hasFollowerPatterns || hasLocationKeywords;

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
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col max-h-[600px] sm:max-h-[700px] lg:max-h-[800px]">
      {/* Header */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-lg sm:text-xl">🤖</span>
          </div>
          <div>
            <h2 className="text-white font-semibold text-base sm:text-lg">Asistente de IA para Influencers</h2>
            <p className="text-blue-100 text-xs sm:text-sm">Encuentra los creadores perfectos para tus campañas</p>
          </div>
          
          {/* Clear Chat Button */}
          {messages.length > 1 && (
            <button
              onClick={clearChatHistory}
              className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1"
              title="Limpiar conversación"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 bg-gray-50/50 min-h-0">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
        
        {/* Progress Bar for Search */}
        {searchProgress && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 px-3 sm:px-5 py-3 sm:py-4 rounded-2xl shadow-lg max-w-full sm:max-w-md w-full">
              <div className="space-y-3 sm:space-y-4">
                {/* Header with icon and stage */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-base sm:text-lg">🔍</div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">{searchProgress?.stage}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-600">{Math.round(searchProgress?.progress || 0)}%</span>
                    {searchProgress?.isComplete && <span className="text-green-500 text-sm">✅</span>}
                    {/* Cancel button for active collaboration checks */}
                    {activeCollaborationCheck && !searchProgress?.isComplete && (
                      <button
                        onClick={cancelCollaborationCheck}
                        className="text-red-500 hover:text-red-700 text-xs font-medium underline ml-2 touch-manipulation"
                        title="Cancelar verificación"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 shadow-inner">
                  <div 
                    className={`h-2 sm:h-3 rounded-full transition-all duration-500 ease-out ${
                      searchProgress?.isComplete 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg' 
                        : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 shadow-md'
                    }`}
                    style={{ width: `${searchProgress?.progress || 0}%` }}
                  >
                    {/* Animated shine effect */}
                    {!searchProgress?.isComplete && (
                      <div className="h-full w-full rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    )}
                  </div>
                </div>
                
                {/* Details */}
                <div className="flex items-center space-x-2">
                  {!searchProgress?.isComplete && (
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                  <span className="text-xs text-gray-600 leading-relaxed">{searchProgress?.details}</span>
                </div>
                
                {/* Estimated time remaining (only for active searches) */}
                {!searchProgress?.isComplete && (searchProgress?.progress || 0) > 10 && (
                  <div className="text-xs text-gray-500 italic">
                    ⏱️ {t('chat.estimated.time', { 
                      time: (searchProgress?.progress || 0) < 60 ? t('chat.time.60-90') : t('chat.time.30-45')
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Simple loading for non-search queries */}
        {isLoading && !searchProgress && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs sm:text-sm text-gray-600">{t('chat.thinking')}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compact Suggested Prompts - Only show until first user message */}
      {messages.length <= 1 && (
        <div className="px-3 sm:px-4 py-2 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="text-xs text-gray-600 mb-1.5 font-medium">{t('chat.try.searches')}</div>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            {[
              { text: `🎯 ${t('chat.fitness.madrid')}`, icon: "🎯" },
              { text: `👩 ${t('chat.beauty.50k')}`, icon: "👩" },
              { text: `🔍 ${t('chat.cristiano.ikea')}`, icon: "🔍" },
              { text: `📄 ${t('chat.upload.pdf')}`, icon: "📄" }
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
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs bg-white border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-gray-700 hover:text-blue-700 whitespace-nowrap flex-shrink-0 touch-manipulation"
              >
                <span className="text-xs">{prompt.icon}</span>
                <span className="hidden sm:inline">{prompt.text.substring(2)}</span>
                <span className="sm:hidden">{prompt.text.split(' ')[0].substring(2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 sm:p-4 lg:p-6 bg-white border-t border-gray-100 flex-shrink-0">
        {/* PDF Upload Area */}
        {uploadedFile && (
          <div className="mb-3 sm:mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-medium text-blue-900 truncate">{uploadedFile.name}</div>
                  <div className="text-xs text-blue-600">
                    {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                    {analysisResult && <span className="ml-2">✅ Analizado</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={removePDFFile}
                className="p-1 text-blue-400 hover:text-blue-600 touch-manipulation flex-shrink-0"
                disabled={isAnalyzing}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex space-x-2 sm:space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={uploadedFile && analysisResult ? t('chat.follow.up.placeholder') : t('chat.default.placeholder')}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs sm:text-sm bg-gray-50 focus:bg-white transition-colors touch-manipulation"
              rows={2}
              disabled={isLoading || isAnalyzing}
            />
          </div>
          
          {/* PDF Upload Button */}
          <button
            onClick={handlePDFUploadClick}
            disabled={isLoading || isAnalyzing}
            className="px-3 sm:px-4 py-2 sm:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
            title={t('chat.upload.pdf.title')}
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || isAnalyzing}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="mt-2 sm:mt-3 text-center">
            <p className="text-xs text-gray-500" dangerouslySetInnerHTML={{ __html: t('chat.pdf.upload.hint') }}>
            </p>
          </div>
        )}

        {/* Session Persistence Indicator */}
        {messages.length > 1 && (
          <div className="mt-2 sm:mt-3 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center space-x-1">
              <span>💾</span>
              <span>{t('chat.conversation.saved')}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 