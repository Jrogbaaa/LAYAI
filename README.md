# LAYAI - Plataforma de Marketing de Influencers en Español

![LAYAI Logo](https://via.placeholder.com/400x100/1E40AF/FFFFFF?text=LAYAI)

> **Inteligencia Artificial para el Descubrimiento de Influencers** - Encuentra los creadores perfectos para tus campañas con IA avanzada y datos verificados de España.

## 🌟 Características Principales

### 🔍 **Búsqueda Híbrida Inteligente**
- **Base de datos verificada** con **1,096+ influencers españoles** importados de datos reales
- **Búsqueda en tiempo real** usando Apify para descubrir nuevos talentos
- **IA conversacional** para consultas naturales en español
- **Filtros avanzados** por plataforma, nicho, ubicación, seguidores y engagement

### 📊 **Datos Precisos y Verificados**
- **Tasas de engagement realistas** (1-15%) normalizadas automáticamente
- **Métricas detalladas** de audiencia y rendimiento
- **Información de contacto** y datos demográficos
- **Análisis de compatibilidad de marca** con puntuaciones personalizadas

### 🤖 **Asistente de IA Avanzado**
- **Procesamiento de lenguaje natural** en español
- **Búsquedas conversacionales** como "Encuentra influencers de hogar en España para IKEA"
- **Seguimiento de historial** y búsquedas incrementales
- **Sugerencias inteligentes** basadas en el contexto

### 📈 **Generación de Propuestas**
- **Propuestas de campaña automatizadas** con IA
- **Cálculos de presupuesto** y alcance estimado
- **Exportación múltiple** (CSV, PDF, formatos personalizados)
- **Análisis de ROI** y métricas de rendimiento

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase
- Claves API de Apify y Serply (opcional)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/LAYAI.git
cd LAYAI
```

### 2. Instalar Dependencias
```bash
npm install
# o
yarn install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API Keys (Opcional - para búsqueda en tiempo real)
APIFY_API_TOKEN=tu-token-apify
SERPLY_API_KEY=tu-clave-serply

# OpenAI (Para generación de propuestas)
OPENAI_API_KEY=tu-clave-openai
```

### 4. Configurar Firebase
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita Firestore Database
3. Configura las reglas de seguridad para permitir lectura/escritura
4. Copia las credenciales al archivo `.env.local`

### 5. Importar Datos de Influencers (Opcional)
Si tienes un archivo CSV con datos de influencers:

```bash
# Coloca tu CSV en el directorio raíz
# Ejecuta el script de importación
node scripts/importVettedInfluencersFixed.js
```

### 6. Ejecutar la Aplicación
```bash
npm run dev
# o
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Uso de la Plataforma

### Búsqueda de Influencers
1. **Página de Inicio**: Introduce criterios básicos de búsqueda
2. **Chat con IA**: Usa consultas naturales como:
   - "Encuentra influencers de lifestyle en Madrid con 100k-500k seguidores"
   - "Muéstrame YouTubers de tecnología verificados"
   - "Busca micro-influencers de belleza en Barcelona"

### Generación de Propuestas
1. Selecciona influencers de los resultados de búsqueda
2. Completa los detalles de la campaña
3. La IA genera automáticamente propuestas profesionales
4. Exporta en múltiples formatos (PDF, CSV, etc.)

### Gestión de Resultados
- **Filtrar** resultados por criterios específicos
- **Comparar** métricas de rendimiento
- **Exportar** listas para plataformas externas
- **Guardar** búsquedas favoritas

## 🛠️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: API Routes de Next.js, Node.js
- **Base de Datos**: Firebase Firestore
- **IA**: OpenAI GPT-4, procesamiento de lenguaje natural
- **APIs Externas**: Apify (scraping), Serply (búsqueda web)

### Estructura del Proyecto
```
LAYAI/
├── src/
│   ├── app/              # App Router de Next.js
│   ├── components/       # Componentes React reutilizables
│   ├── lib/              # Servicios y utilidades
│   ├── types/            # Definiciones de TypeScript
│   └── data/             # Datos estáticos y configuración
├── scripts/              # Scripts de utilidad e importación
├── public/               # Archivos estáticos
└── docs/                 # Documentación del proyecto
```

### APIs Principales

#### 🔍 Enhanced Search API
**Endpoint**: `/api/enhanced-search`
**Método**: POST

Realiza búsqueda híbrida combinando datos verificados y búsqueda en tiempo real.

```typescript
interface SearchParams {
  platforms: string[];
  niches: string[];
  minFollowers: number;
  maxFollowers: number;
  location?: string;
  brandName?: string;
  userQuery?: string;
  maxResults: number;
}
```

#### 💬 Chat API  
**Endpoint**: `/api/chat`
**Método**: POST

Procesa consultas en lenguaje natural y determina si ejecutar búsqueda o responder conversacionalmente.

#### 🤖 Proposal Generation API
**Endpoint**: `/api/proposal-generation`
**Método**: POST

Genera propuestas de campaña personalizadas usando IA.

## 🔧 Características Avanzadas

### Base de Datos de Influencers Verificados
- **1,096+ influencers españoles** con datos verificados
- **Métricas de engagement normalizadas** (1-15%)
- **Información de contacto** y demografía
- **Categorización automática** por nicho y audiencia

### Sistema de Puntuación de Marca
- **Algoritmo de compatibilidad** personalizado
- **Análisis de audiencia** y demografía
- **Factores de engagement** y actividad
- **Puntuación ponderada** por múltiples criterios

### Manejo de Errores Robusto
- **Validación de datos** en tiempo real
- **Fallbacks automáticos** para valores undefined
- **Gestión de errores de API** con reintentos
- **Logging detallado** para debugging

## 📈 Métricas y Análisis

### Datos Disponibles por Influencer
- **Seguidores**: Conteo total verificado
- **Engagement Rate**: Tasa normalizada (1-15%)
- **Demografía**: Edad, género, ubicación
- **Costo Estimado**: Basado en seguidores y engagement
- **Alcance Potencial**: Calculado dinámicamente
- **Historial**: Colaboraciones pasadas y rendimiento

### Exportación de Datos
- **CSV**: Para análisis en Excel/Google Sheets
- **PDF**: Propuestas profesionales listas para cliente
- **Hibiki**: Formato compatible con Hibiki
- **Orange**: Formato personalizado para Orange

## 🐛 Resolución de Problemas

### Errores Comunes

#### Error: "Cannot read properties of undefined"
**Solución**: Ya resuelto con validaciones defensivas en todos los componentes.

#### Tasas de engagement irreales (>20%)
**Solución**: Sistema automático de normalización implementado.

#### Resultados de búsqueda vacíos
**Verificar**:
1. Conexión a Firebase
2. Datos importados correctamente
3. Filtros de búsqueda no demasiado restrictivos

### Logs de Debug
```bash
# Ver logs detallados en consola del navegador
# O en terminal si ejecutas en desarrollo
npm run dev
```

## 🤝 Contribución

### Proceso de Desarrollo
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Estándares de Código
- **TypeScript** para tipado estático
- **ESLint** para calidad de código
- **Prettier** para formateo consistente
- **Convenciones**: Nombres en español para UI, inglés para código

## 📚 Documentación Adicional

### Archivos de Documentación
- `docs/API.md` - Documentación completa de APIs
- `docs/DEPLOYMENT.md` - Guía de despliegue en producción
- `docs/CONTRIBUTING.md` - Guía detallada de contribución
- `docs/ARCHITECTURE.md` - Arquitectura técnica profunda

### Recursos Externos
- [Documentación de Firebase](https://firebase.google.com/docs)
- [API de Apify](https://docs.apify.com/)
- [OpenAI API](https://platform.openai.com/docs)

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Firebase** por la infraestructura de base de datos
- **Apify** por las herramientas de scraping
- **OpenAI** por las capacidades de IA
- **Comunidad open source** por las bibliotecas utilizadas

---

**Desarrollado con ❤️ para el mercado de influencers en español**

*Para soporte técnico o preguntas, por favor abre un issue en GitHub.* 