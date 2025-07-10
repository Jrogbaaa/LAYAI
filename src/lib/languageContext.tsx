'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations = {
  en: {
    // Navigation
    'nav.search': 'Influencer Search',
    'nav.search.desc': 'Find and discover influencers',
    'nav.generate': 'Generate Proposal',
    'nav.generate.desc': 'Create campaign proposals',
    'nav.campaigns': 'Campaigns',
    'nav.campaigns.desc': 'Manage your campaigns',
    'nav.notes': 'Notes',
    'nav.notes.desc': 'Manage your notes',
    
    // Main interface
    'main.platform': 'AI Platform',
    'main.tagline': 'Influencer Marketing Platform',
    'main.description': 'Discover, analyze and collaborate with the best influencers to create impactful campaigns.',
    'main.version': 'Version 2.22.0 • Influencer Marketing',
    'main.status': 'System active',
    
    // Search interface
    'search.title': 'AI Assistant for Influencers',
    'search.subtitle': 'Find the perfect creators for your campaigns',
    'search.loading': 'Searching for influencers...',
    'search.loading.desc': 'Analyzing profiles and verifying compatibility',
    
    // Results
    'results.matches': 'Perfect Match',
    'results.matches.plural': 'Perfect Matches',
    'results.ranked': 'Ranked by compatibility score and performance',
    'results.average.score': 'Average Score',
    'results.average.engagement': 'Average Engagement',
    'results.verified': 'Verified',
    'results.quality.distribution': 'Quality Distribution',
    'results.followers': 'Followers',
    'results.estimated.rate': 'Est. Rate',
    
    // Chatbot
    'chat.welcome': "Hello! I'm your AI assistant for finding influencers. You can:\n\n🔍 Write your search: 'Find fashion influencers on Instagram'\n📄 Upload a PDF proposal for personalized search\n🤝 Ask about collaborations: 'Has Cristiano worked with IKEA?'\n👥 Find similar profiles: 'Here's a profile - find me similar influencers: [description]'\n💡 Ask follow-up questions to refine results\n\nHow would you like to start?",
    'chat.analyzing': 'Analyzing your PDF proposal... This may take a few seconds.',
    'chat.uploaded': 'Uploaded proposal',
    'chat.analysis.complete': 'Analysis completed! I detected:',
    'chat.refinements': 'You can make refinements now via chat:',
    'chat.refinement.male': 'Only male influencers',
    'chat.refinement.focus': 'Focus on lifestyle/fashion',
    'chat.refinement.followers': 'Minimum 100k followers',
    'chat.refinement.note': 'All your refinements will be automatically included when you click "Start Search"',
    'chat.search.completed': 'SEARCH COMPLETED!',
    'chat.found.influencers': 'I found {count} influencers perfectly aligned with your criteria',
    'chat.results.sorted': 'Results are sorted by brand compatibility',
    'chat.review.profiles': 'Review the profiles below to find the best options',
    'chat.saved.campaign': 'All influencers have been automatically saved to your campaign',
    'chat.checking.collaboration': 'Checking if {influencer} has worked with {brand} previously...',
    'chat.analyzing.profile': 'Analyzing the profile description to find similar influencers...',
    
    // Proposal Generator
    'proposal.title': 'Proposal Generator',
    'proposal.subtitle': 'Create professional proposals for your influencer marketing campaigns',
    
    // Campaign Manager
    'campaigns.title': 'Campaign Management',
    'campaigns.subtitle': 'Manage and monitor your influencer marketing campaigns',
    
    // Notes Manager
    'notes.title': 'Notes and Reminders',
    'notes.subtitle': 'Manage your notes, ideas and campaign reminders',
    
    // Common
    'common.close': 'Close',
    'common.menu': 'Menu',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.view': 'View',
    'common.go.to': 'Go to',
    
    // Language switcher
    'language.english': 'English',
    'language.spanish': 'Spanish',
    'language.switch': 'Switch Language',
    
    // Proposal Generator
    'proposal.brand.name': 'Brand Name',
    'proposal.campaign.name': 'Campaign Name',
    'proposal.client': 'Client',
    'proposal.budget': 'Budget',
    'proposal.add.influencers': 'Add Influencers',
    'proposal.add.influencers.instagram': 'Add Instagram Influencers',
    'proposal.processing': 'Processing...',
    'proposal.researching.brand': 'Researching Brand...',
    'proposal.research.complete': 'Brand Research Complete ✨',
    'proposal.research.analyzing': 'Analyzing brand information to generate personalized insights and specific reasons for each influencer.',
    'proposal.research.industry': 'Industry:',
    'proposal.research.values': 'Values:',
    'proposal.research.target': 'Target Audience:',
    'proposal.research.note': '💡 Influencers will now show personalized reasons based on this research.',
    'proposal.manual.section': 'Manual Upload Section',
    'proposal.manual.description': 'Add Instagram usernames separated by commas or new lines. You can include @ or not, we will process them. We will obtain real-time data and generate personalized analysis.',
    'proposal.manual.examples': 'Valid examples: "cristiano, therock, kyliejenner" or separated by lines or "@cristiano @therock @kyliejenner"',
    'proposal.create.subtitle': 'Create professional influencer campaign proposals using AI-powered insights',
    'proposal.select.talents': 'Select Talents for Proposal ({count} selected)',
    'proposal.talents.selected': '{count} talent{plural} selected',
    'proposal.no.influencers': 'No influencers added yet',
    'proposal.add.usernames': 'Add Instagram usernames above to see influencer profiles here.',
    'proposal.followers': 'followers',
    'proposal.estimated.rate': 'Estimated rate',
    'proposal.perfect.for': 'Why Perfect for {brand}',
    'proposal.generate.proposal': 'Generate Proposal ({count} talents)',
    'proposal.export.csv': 'Export CSV ({count} talents)',
    
    // Chatbot
    'chat.try.searches': '💡 Try these searches:',
    'chat.fitness.madrid': 'Fitness influencers Madrid',
    'chat.beauty.50k': 'Beauty +50K followers',
    'chat.cristiano.ikea': 'Cristiano with IKEA?',
    'chat.upload.pdf': 'Upload PDF',
    'chat.follow.up.placeholder': 'Ask follow-up questions or refine the search...',
    'chat.default.placeholder': 'Ask me to find influencers or upload a PDF...',
    'chat.upload.pdf.title': 'Upload PDF proposal',
    'chat.thinking': 'Thinking...',
    'chat.estimated.time': 'Estimated time: {time}',
    'chat.time.60-90': '60-90 seconds',
    'chat.time.30-45': '30-45 seconds',
    'chat.pdf.upload.hint': '💡 <strong>New:</strong> Upload a PDF proposal for ultra-personalized searches',
    'chat.conversation.saved': 'Your conversation is saved automatically',
    
    // Search Interface
    'search.start.your.search': 'Start your search',
    'search.use.chat.filters': 'Use AI chat or filters to find the perfect influencers for your campaign',
    'search.chat.functions': '✨ AI Chat Functions:',
    'search.natural.search': 'Natural Search:',
    'search.pdf.analysis': 'PDF Analysis:',
    'search.verification': 'Verification:',
    'search.refinement': 'Refinement:',
    'search.natural.example': '"Find female fitness influencers in Madrid"',
    'search.pdf.example': 'Upload proposals for personalized search',
    'search.verification.example': '"Has Cristiano worked with Nike?"',
    'search.refinement.example': 'Ask follow-up questions',
    
    // AI Assistant
    'ai.assistant.title': 'AI Assistant for Influencers',
    'ai.assistant.subtitle': 'Find the perfect creators for your campaigns',
    
    // Dropdown Search
    'dropdown.location': 'Location',
    'dropdown.any.location': 'Any location',
    'dropdown.niche.fashion': 'Fashion',
    'dropdown.niche.beauty': 'Beauty',
    'dropdown.niche.fitness': 'Fitness',
    'dropdown.niche.food': 'Food',
    'dropdown.niche.travel': 'Travel',
    'dropdown.niche.tech': 'Technology',
    'dropdown.niche.gaming': 'Gaming',
    'dropdown.niche.music': 'Music',
    'dropdown.niche.sports': 'Sports',
    'dropdown.niche.business': 'Business',
    'dropdown.niche.entertainment': 'Entertainment',
    'dropdown.niche.home': 'Home',
    'dropdown.niche.parenting': 'Parenting',
    'dropdown.niche.education': 'Education',
    
    // Gender options
    'dropdown.gender.any': 'Any gender',
    'dropdown.gender.male': 'Male',
    'dropdown.gender.female': 'Female',
    'dropdown.gender.nonbinary': 'Non-binary',
    
    // Age options
    'dropdown.age.any': 'Any age',
    'dropdown.age.13-17': '13-17 years',
    'dropdown.age.18-24': '18-24 years',
    'dropdown.age.25-34': '25-34 years',
    'dropdown.age.35-44': '35-44 years',
    'dropdown.age.45-54': '45-54 years',
    'dropdown.age.55+': '55+ years',
    
    // Influencer Results
    'audienceDemographics': 'Audience Demographics',
    'mainAge': 'Main Age',
    'gender': 'Gender',
    'whyGoodMatch': 'Why this is a good match',
    'viewProfile': 'View Profile',
    'searchMoreInfo': 'Search more info',
    
    // Campaign Manager
    'campaign.delete.confirm': 'Are you sure you want to delete this campaign?',
    'campaign.loading': 'Loading campaigns...',
    'campaigns.new.campaign': 'New Campaign',
    'campaigns.stats.total': 'Total Campaigns',
    'campaigns.stats.searches': 'Saved Searches',
    'campaigns.stats.influencers': 'Saved Influencers',
    'campaigns.stats.active': 'Active Campaigns',
    'campaign.table.campaign': 'Campaign',
    'campaign.table.owner': 'Owner',
    'campaign.table.status': 'Status',
    'campaign.table.priority': 'Priority',
    'campaign.table.timeline': 'Timeline',
    'campaign.table.budget': 'Budget',
    'campaign.table.searches': 'Searches',
    'campaign.table.influencers': 'Influencers',
    'campaign.table.notes': 'Notes',
    'campaign.table.actions': 'Actions',
  },
  es: {
    // Navigation
    'nav.search': 'Búsqueda de Influencers',
    'nav.search.desc': 'Encuentra y descubre influencers',
    'nav.generate': 'Generar Propuesta',
    'nav.generate.desc': 'Crear propuestas de campaña',
    'nav.campaigns': 'Campañas',
    'nav.campaigns.desc': 'Gestiona tus campañas',
    'nav.notes': 'Notas',
    'nav.notes.desc': 'Gestiona tus notas',
    
    // Main interface
    'main.platform': 'Plataforma AI',
    'main.tagline': 'Plataforma de Marketing de Influencers',
    'main.description': 'Descubre, analiza y colabora con los mejores influencers para crear campañas impactantes.',
    'main.version': 'Versión 2.22.0 • Marketing de Influencers',
    'main.status': 'Sistema activo',
    
    // Search interface
    'search.title': 'Asistente AI para Influencers',
    'search.subtitle': 'Encuentra los creadores perfectos para tus campañas',
    'search.loading': 'Buscando influencers...',
    'search.loading.desc': 'Analizando perfiles y verificando compatibilidad',
    
    // Results
    'results.matches': 'Coincidencia Perfecta',
    'results.matches.plural': 'Coincidencias Perfectas',
    'results.ranked': 'Clasificados por puntuación de compatibilidad y rendimiento',
    'results.average.score': 'Puntuación Promedio',
    'results.average.engagement': 'Engagement Promedio',
    'results.verified': 'Verificados',
    'results.quality.distribution': 'Distribución de Calidad',
    'results.followers': 'Seguidores',
    'results.estimated.rate': 'Tarifa Est.',
    
    // Chatbot
    'chat.welcome': "¡Hola! Soy tu asistente de IA para encontrar influencers. Puedes:\n\n🔍 Escribir tu búsqueda: 'Encuentra influencers de moda en Instagram'\n📄 Subir una propuesta PDF para búsqueda personalizada\n🤝 Preguntar sobre colaboraciones: '¿Ha trabajado Cristiano con IKEA?'\n👥 Encontrar perfiles similares: 'Aquí tienes un perfil - encuentra influencers similares: [descripción]'\n💡 Hacer preguntas de seguimiento para refinar resultados\n\n¿Cómo te gustaría empezar?",
    'chat.analyzing': 'Analizando tu propuesta PDF... Esto puede tomar unos segundos.',
    'chat.uploaded': 'Propuesta subida',
    'chat.analysis.complete': '¡Análisis completado! Detecté:',
    'chat.refinements': 'Puedes hacer refinamientos ahora via chat:',
    'chat.refinement.male': 'Solo influencers masculinos',
    'chat.refinement.focus': 'Enfoque en lifestyle/moda',
    'chat.refinement.followers': 'Mínimo 100k seguidores',
    'chat.refinement.note': 'Todos tus refinamientos se incluirán automáticamente cuando hagas click en "Iniciar Búsqueda"',
    'chat.search.completed': '¡BÚSQUEDA COMPLETADA!',
    'chat.found.influencers': 'Encontré {count} influencers perfectamente alineados con tus criterios',
    'chat.results.sorted': 'Los resultados están ordenados por compatibilidad de marca',
    'chat.review.profiles': 'Revisa los perfiles a continuación para encontrar las mejores opciones',
    'chat.saved.campaign': 'Todos los influencers han sido automáticamente guardados en tu campaña',
    'chat.checking.collaboration': 'Revisando si {influencer} ha trabajado con {brand} anteriormente...',
    'chat.analyzing.profile': 'Analizando la descripción del perfil para encontrar influencers similares...',
    
    // Proposal Generator
    'proposal.title': 'Generador de Propuestas',
    'proposal.subtitle': 'Crea propuestas profesionales para tus campañas de influencer marketing',
    
    // Campaign Manager
    'campaigns.title': 'Gestión de Campañas',
    'campaigns.subtitle': 'Administra y monitorea tus campañas de influencer marketing',
    
    // Notes Manager
    'notes.title': 'Notas y Recordatorios',
    'notes.subtitle': 'Gestiona tus notas, ideas y recordatorios de campañas',
    
    // Common
    'common.close': 'Cerrar',
    'common.menu': 'Menú',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.export': 'Exportar',
    'common.import': 'Importar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.sort': 'Ordenar',
    'common.view': 'Ver',
    'common.go.to': 'Ir a',
    
    // Language switcher
    'language.english': 'Inglés',
    'language.spanish': 'Español',
    'language.switch': 'Cambiar Idioma',
    
    // Proposal Generator
    'proposal.brand.name': 'Nombre de Marca',
    'proposal.campaign.name': 'Nombre de Campaña',
    'proposal.client': 'Cliente',
    'proposal.budget': 'Presupuesto',
    'proposal.add.influencers': 'Agregar Influencers',
    'proposal.add.influencers.instagram': 'Agregar Influencers de Instagram',
    'proposal.processing': 'Procesando...',
    'proposal.researching.brand': 'Investigando Marca...',
    'proposal.research.complete': 'Investigación de Marca Completa ✨',
    'proposal.research.analyzing': 'Analizando información de marca para generar insights personalizados y razones específicas para cada influencer.',
    'proposal.research.industry': 'Industria:',
    'proposal.research.values': 'Valores:',
    'proposal.research.target': 'Audiencia Objetivo:',
    'proposal.research.note': '💡 Los influencers ahora mostrarán razones personalizadas basadas en esta investigación.',
    'proposal.manual.section': 'Sección de Carga Manual',
    'proposal.manual.description': 'Ingresa nombres de usuario de Instagram separados por comas o nuevas líneas. Puedes incluir @ o no, nosotros lo procesaremos. Obtendremos datos en tiempo real y generaremos análisis personalizados.',
    'proposal.manual.examples': 'Ejemplos válidos: "cristiano, therock, kyliejenner" o separados por líneas o "@cristiano @therock @kyliejenner"',
    'proposal.create.subtitle': 'Crear propuestas profesionales de campañas con influencers usando insights potenciados por IA',
    'proposal.select.talents': 'Seleccionar Talentos para Propuesta ({count} seleccionados)',
    'proposal.talents.selected': '{count} talento{plural} seleccionado{plural}',
    'proposal.no.influencers': 'Aún no se han agregado influencers',
    'proposal.add.usernames': 'Agrega nombres de usuario de Instagram arriba para ver perfiles de influencers aquí.',
    'proposal.followers': 'seguidores',
    'proposal.estimated.rate': 'Tarifa estimada',
    'proposal.perfect.for': 'Por Qué Es Perfecto para {brand}',
    'proposal.generate.proposal': 'Generar Propuesta ({count} talentos)',
    'proposal.export.csv': 'Exportar CSV ({count} talentos)',
    
    // Chatbot
    'chat.try.searches': '💡 Prueba estas búsquedas:',
    'chat.fitness.madrid': 'Influencers fitness Madrid',
    'chat.beauty.50k': 'Beauty +50K seguidores',
    'chat.cristiano.ikea': '¿Cristiano con IKEA?',
    'chat.upload.pdf': 'Subir PDF',
    'chat.follow.up.placeholder': 'Haz preguntas de seguimiento o refina la búsqueda...',
    'chat.default.placeholder': 'Pídeme que encuentre influencers o sube un PDF...',
    'chat.upload.pdf.title': 'Subir propuesta PDF',
    'chat.thinking': 'Pensando...',
    'chat.estimated.time': 'Tiempo estimado: {time}',
    'chat.time.60-90': '60-90 segundos',
    'chat.time.30-45': '30-45 segundos',
    'chat.pdf.upload.hint': '💡 <strong>Nuevo:</strong> Sube una propuesta PDF para búsquedas ultra-personalizadas',
    'chat.conversation.saved': 'Tu conversación se guarda automáticamente',
    
    // Search Interface
    'search.start.your.search': 'Comienza tu búsqueda',
    'search.use.chat.filters': 'Usa el chat IA o los filtros para encontrar los influencers perfectos para tu campaña',
    'search.chat.functions': '✨ Funciones del Chat IA:',
    'search.natural.search': 'Búsqueda Natural:',
    'search.pdf.analysis': 'Análisis PDF:',
    'search.verification': 'Verificación:',
    'search.refinement': 'Refinamiento:',
    'search.natural.example': '"Encuentra influencers de fitness femeninos en Madrid"',
    'search.pdf.example': 'Sube propuestas para búsqueda personalizada',
    'search.verification.example': '"¿Ha trabajado Cristiano con Nike?"',
    'search.refinement.example': 'Haz preguntas de seguimiento',
    
    // AI Assistant
    'ai.assistant.title': 'Asistente de IA para Influencers',
    'ai.assistant.subtitle': 'Encuentra los creadores perfectos para tus campañas',
    
    // Dropdown Search
    'dropdown.location': 'Ubicación',
    'dropdown.any.location': 'Cualquier ubicación',
    'dropdown.niche.fashion': 'Moda',
    'dropdown.niche.beauty': 'Belleza',
    'dropdown.niche.fitness': 'Fitness',
    'dropdown.niche.food': 'Comida',
    'dropdown.niche.travel': 'Viajes',
    'dropdown.niche.tech': 'Tecnología',
    'dropdown.niche.gaming': 'Gaming',
    'dropdown.niche.music': 'Música',
    'dropdown.niche.sports': 'Deportes',
    'dropdown.niche.business': 'Negocios',
    'dropdown.niche.entertainment': 'Entretenimiento',
    'dropdown.niche.home': 'Hogar',
    'dropdown.niche.parenting': 'Paternidad',
    'dropdown.niche.education': 'Educación',
    
    // Gender options
    'dropdown.gender.any': 'Cualquier género',
    'dropdown.gender.male': 'Masculino',
    'dropdown.gender.female': 'Femenino',
    'dropdown.gender.nonbinary': 'No binario',
    
    // Age options
    'dropdown.age.any': 'Cualquier edad',
    'dropdown.age.13-17': '13-17 años',
    'dropdown.age.18-24': '18-24 años',
    'dropdown.age.25-34': '25-34 años',
    'dropdown.age.35-44': '35-44 años',
    'dropdown.age.45-54': '45-54 años',
    'dropdown.age.55+': '55+ años',
    
    // Influencer Results
    'audienceDemographics': 'Demografía de Audiencia',
    'mainAge': 'Edad Principal',
    'gender': 'Género',
    'whyGoodMatch': 'Por qué es una buena opción',
    'viewProfile': 'Ver Perfil',
    'searchMoreInfo': 'Buscar más info',
    
    // Campaign Manager
    'campaign.delete.confirm': '¿Estás seguro de que quieres eliminar esta campaña?',
    'campaign.loading': 'Cargando campañas...',
    'campaigns.new.campaign': 'Nueva Campaña',
    'campaigns.stats.total': 'Total Campañas',
    'campaigns.stats.searches': 'Búsquedas Guardadas',
    'campaigns.stats.influencers': 'Influencers Guardados',
    'campaigns.stats.active': 'Campañas Activas',
    'campaign.table.campaign': 'Campaña',
    'campaign.table.owner': 'Propietario',
    'campaign.table.status': 'Estado',
    'campaign.table.priority': 'Prioridad',
    'campaign.table.timeline': 'Cronograma',
    'campaign.table.budget': 'Presupuesto',
    'campaign.table.searches': 'Búsquedas',
    'campaign.table.influencers': 'Influencers',
    'campaign.table.notes': 'Notas',
    'campaign.table.actions': 'Acciones',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('layai-language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('layai-language', language);
  }, [language]);

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    const translation = translations[language][key as keyof typeof translations[typeof language]] || key;
    
    if (params) {
      return Object.entries(params).reduce((str, [param, value]) => {
        return str.replace(new RegExp(`{${param}}`, 'g'), value);
      }, translation);
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 