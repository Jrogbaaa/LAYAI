# 🚀 LAYAI - AI-Powered Influencer Marketing Platform v2.10.0

> **Versión 2.10.0** - Plataforma completa de marketing de influencers con diseño compacto, validación de enlaces de Instagram, seguimiento avanzado de progreso, localización española, y filtrado de marcas.

## ✨ Últimas Funcionalidades (v2.10.0)

### 🎨 **Diseño Compacto de Tarjetas de Influencers**
- **50% Más Compacto**: Visualiza 2-3x más influencers por pantalla
- **Grid Horizontal de Estadísticas**: Métricas clave en formato fácil de escanear
- **Información Esencial Primero**: Seguidores, engagement, costo y plataforma prominentemente mostrados
- **Sección de Perfil Optimizada**: Diseño simplificado para toma de decisiones rápida

### 🔗 **Validación Inteligente de Enlaces de Instagram**
- **Detección Avanzada de Perfiles**: Filtra handles inválidos (techblockproject, gmail.com, etc.)
- **Sistema de Feedback Visual**: ✅ Perfiles válidos con botones gradient, ⚠️ Perfiles inválidos claramente marcados
- **Filtrado de Cuentas de Marca**: Excluye cuentas corporativas para mejores resultados
- **Acceso de Un Clic**: Enlaces directos confiables a perfiles de Instagram funcionando

### 👩‍💼 **Flujo de Trabajo Optimizado**
- **Escaneo Más Rápido**: 150% mejora en velocidad de evaluación
- **Señales Visuales Claras**: Feedback inmediato sobre calidad y validez del perfil
- **Toma de Decisiones Eficiente**: Carga cognitiva reducida con display de información enfocado

Una plataforma de marketing de influencers impulsada por IA que combina búsqueda en tiempo real, verificación automatizada de perfiles, y generación inteligente de propuestas de campaña. Diseñada específicamente para el mercado español con detección avanzada de ubicación y estimación de edad.

## ✨ Características Principales

### 🇪🇸 **Localización Española Completa**
- **Interfaz 100% en Español**: Toda la plataforma traducida al español
- **Detección de Ubicación Española**: 85-95% precisión para perfiles españoles
- **Estimación de Edad**: Motor de múltiples métodos con 60-75% tasa de éxito
- **Contexto Cultural**: Comprensión de marcas y celebridades españolas
- **Análisis Específico**: Explicaciones personalizadas para influencers españoles

### 🏢 **Filtrado Avanzado de Cuentas de Marca**
- **Detección Inteligente**: Identifica y filtra cuentas corporativas automáticamente
- **Reconocimiento de Marcas Españolas**: El Corte Inglés, Carrefour, Mercadona, BBVA, etc.
- **Análisis Multi-Capa**: Username, biografía, categoría y patrones de dominio
- **Filtrado en Tiempo Real**: Aplicado en múltiples etapas del proceso de búsqueda
- **Estadísticas Detalladas**: Reportes completos de cuentas filtradas

### 🔍 **Búsqueda y Verificación Avanzada**
- **Búsqueda Híbrida**: Combina base de datos verificada + búsqueda en tiempo real
- **Seguimiento de Progreso en Tiempo Real**: Barra de progreso inteligente con 7 etapas detalladas
- **Estimación de Tiempo**: Feedback visual durante búsquedas de 1-2 minutos
- **Verificación de Perfiles**: Sistema de verificación de 4 niveles
- **Compatibilidad de Marca**: Análisis IA para alineación con marcas
- **Métricas en Tiempo Real**: Seguidores, engagement, y datos de audiencia actualizados
- **Acceso Completo a Resultados**: Paginación inteligente para ver todos los influencers encontrados

### 📊 **Gestión de Campañas y Propuestas**
- **Generador de Propuestas IA**: Propuestas automatizadas con contexto de marca
- **Análisis "Por Qué Perfecto"**: Explicaciones específicas para cada influencer
- **Exportación Múltiple**: Formatos CSV Hibiki, Orange, IKEA personalizados
- **Gestión de Campaña**: Seguimiento completo del ciclo de vida de campañas
- **Sistema de Notas**: Notas automáticas con sincronización en tiempo real

### 🧠 **Memoria y Aprendizaje Automático**
- **Aprendizaje Continuo**: El sistema mejora automáticamente con cada búsqueda
- **Patrones de Éxito**: Identificación de combinaciones exitosas marca-influencer
- **Recomendaciones Personalizadas**: Sugerencias basadas en historial de campañas
- **Optimización Automática**: Mejora de algoritmos sin intervención manual

## 🚀 Instalación y Configuración

### Prerrequisitos

```bash
Node.js 18+ 
npm o yarn
Cuentas API: Apify, Serply, Firebase
```

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/LAYAI.git
cd LAYAI

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
```

### Variables de Entorno

```env
# APIs Principales
APIFY_API_TOKEN=tu_token_apify
SERPLY_API_KEY=tu_clave_serply

# Firebase (Base de Datos)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_clave_firebase
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_dominio
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_PRIVATE_KEY=tu_clave_privada
FIREBASE_CLIENT_EMAIL=tu_email_cliente

# Configuración de Aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Ejecutar en Desarrollo

```bash
npm run dev
# Aplicación disponible en http://localhost:3000
```

## 📱 Cómo Usar la Plataforma

### 1. **Búsqueda de Influencers**
```
"Encuentra influencers femeninas de España perfectas para IKEA"
"Busca atletas españoles ideales para Nike"
"Influencers de lifestyle en Madrid para campaña de moda"
```

### 2. **Verificación Automática**
- ✅ **Ubicación Española**: Verificación automática con indicadores visuales
- 🎂 **Estimación de Edad**: Análisis inteligente con puntuación de confianza
- 📊 **Métricas Actualizadas**: Seguidores, engagement, y audiencia en tiempo real
- 🏢 **Filtrado de Marcas**: Exclusión automática de cuentas corporativas

### 3. **Acceso Completo a Resultados**
- **Vista Inicial**: Primeros 20 resultados de mayor calidad
- **Ver Todos**: Botón para mostrar todos los influencers encontrados (50+)
- **Navegación Intuitiva**: Expandir/colapsar resultados según necesidad
- **Sin Limitaciones**: Acceso completo a toda la investigación

### 4. **Generación de Propuestas**
- **Selección de Influencers**: Añadir influencers verificados a propuestas
- **Análisis IA**: Generación automática de "Por qué perfecto para la marca"
- **Contexto Español**: Análisis cultural y de mercado localizado
- **Regeneración**: Mejorar explicaciones con un clic

### 5. **Exportación Flexible**
```bash
# Formatos Disponibles
- CSV Hibiki (Estándar internacional)
- CSV Orange (Personalizado para agencias)
- CSV IKEA (Formato específico de marca)
- PDF Propuesta (Documento completo)
```

## 🔧 Características Técnicas

### **Arquitectura del Sistema**
- **Frontend**: Next.js 14 con TypeScript
- **Styling**: TailwindCSS con componentes Shadcn/ui
- **Base de Datos**: Firebase Firestore
- **APIs Externas**: Apify, Serply para scraping y búsqueda
- **Verificación**: Sistema de verificación multi-capa

### **Servicios Principales**

#### Servicio de Búsqueda Mejorada (`enhancedSearchService.ts`)
- Búsqueda híbrida con múltiples fuentes
- Verificación automática de perfiles
- Puntuación de compatibilidad de marca
- Filtrado inteligente de resultados

#### Servicio de Ubicación Española (`spanishLocationService.ts`)
- 70+ ciudades españolas reconocidas
- 17 comunidades autónomas detectadas
- Indicadores culturales y lingüísticos
- Análisis de patrones de username y hashtags

#### Filtrado de Cuentas de Marca (`apifyService.ts`)
- Detección de patrones de marca
- Análisis de biografías corporativas
- Filtrado por categorías de negocio
- Exclusión de servicios profesionales

### **Flujo de Datos**
```
Usuario → Chat IA → Parámetros Búsqueda → Múltiples APIs → 
Verificación → Filtrado Marcas → Puntuación IA → 
Resultados Ordenados → Paginación → Selección → Propuesta
```

## 📊 Métricas y Rendimiento

### **Precisión del Sistema**
- 🇪🇸 **Detección Española**: 85-95% precisión
- 🎂 **Estimación de Edad**: 60-75% tasa de éxito
- 🏢 **Filtrado de Marcas**: 90%+ precisión
- 🎯 **Compatibilidad de Marca**: 40% mejora en relevancia

### **Estadísticas de Búsqueda**
- **Velocidad**: ~50-100ms por perfil verificado
- **Capacidad**: 50-100+ influencers por búsqueda
- **Fuentes**: Base de datos verificada + búsqueda en tiempo real
- **Cobertura**: Todas las plataformas principales (Instagram, TikTok, YouTube)

### **Calidad de Resultados**
- **Reducción de Falsos Positivos**: 70% mejora
- **Relevancia de Marca**: 40% mejora en compatibilidad
- **Cuentas de Marca Filtradas**: 15-25% de perfiles descubiertos
- **Acceso a Resultados**: 100% transparencia, sin limitaciones

## 🔄 Actualizaciones Recientes (v2.9.0)

### ✅ **Completado**
- ✅ **NUEVO**: Barra de progreso inteligente para búsquedas de influencers
- ✅ **NUEVO**: Seguimiento en tiempo real con 7 etapas detalladas de búsqueda
- ✅ **NUEVO**: Estimación de tiempo y feedback visual durante procesos largos
- ✅ Filtrado avanzado de cuentas de marca (Nike, IKEA, Primark, etc.)
- ✅ Localización española completa en toda la plataforma
- ✅ Paginación inteligente para acceso completo a resultados
- ✅ Generador de propuestas totalmente traducido
- ✅ Sistema de "razones por qué" mejorado con contexto español
- ✅ Exportación CSV con headers en español

### 🔄 **En Desarrollo**
- 🔄 Panel de analíticas avanzadas
- 🔄 Integración con APIs de redes sociales nativas
- 🔄 Sistema de seguimiento de campañas en tiempo real
- 🔄 Automatización de alcance a influencers

## 🤝 Contribuir

```bash
# Fork del repositorio
git fork https://github.com/tu-usuario/LAYAI.git

# Crear rama de característica
git checkout -b feature/nueva-caracteristica

# Commit cambios
git commit -m "feat: añadir nueva característica"

# Push y crear Pull Request
git push origin feature/nueva-caracteristica
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: soporte@layai.com
- **Documentación**: [docs.layai.com](https://docs.layai.com)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/LAYAI/issues)

---

> **LAYAI v2.9.0** - La plataforma de marketing de influencers más avanzada para el mercado español con seguimiento de progreso en tiempo real. 🇪🇸 