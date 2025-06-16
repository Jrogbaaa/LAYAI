# Environment Setup Guide

## Required Environment Variables

Add these to your `.env.local` file:

### SocialBlade API (Optional - Enhanced Analytics)
```
SOCIALBLADE_CLIENT_ID=your_client_id_here
SOCIALBLADE_TOKEN=your_token_here
```

**⚠️ Current Status**: SocialBlade API is returning 402 errors (payment required/quota exceeded)
- The system gracefully falls back to Apify data when SocialBlade is unavailable
- You still get real Instagram metrics and enhanced analysis
- Consider upgrading your SocialBlade plan or using the free tier limits

**Where to get these:**
1. Go to [SocialBlade Developer Console](https://socialblade.com/developers/console)
2. Sign in to your account
3. Copy your Client ID and Token from the dashboard
4. These credentials provide accurate influencer statistics, rankings, and historical data

### Core APIs (Required)
```
APIFY_API_TOKEN=apify_api_jiPL0ilBza6FA410FdZ2NczaTHeWVM3jmOjy
SERPLY_API_KEY=JB6Xzi4AYqasd6Atc1V3CPAs
FIRECRAWL_API_KEY=fc-c6e182fd637c40238d0b7362e1d91a5a
```

### Firebase Configuration (Required)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBWPf0bDAM9zWAIJLlsVwgqHaELi70UavI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=layai-8d755.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=layai-8d755
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=layai-8d755.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=261921951232
NEXT_PUBLIC_FIREBASE_APP_ID=1:261921951232:web:b20b5f2de1c5a07d2c12e5
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-V621Y968FJ
```

## System Architecture & Data Flow

### 🔄 Complete Influencer Analysis Process

The system now implements a sophisticated 5-step enhancement process:

#### Step 1: Brand Research
- Automatically researches brand using web search API
- Extracts brand values, industry, target audience, and products
- Creates brand intelligence profile for personalized matching

#### Step 2: Real Instagram Profile Scraping
- Uses Apify Instagram Profile Scraper for authentic data
- Retrieves real follower counts, engagement rates, and profile information
- Processes multiple profiles in batch for efficiency

#### Step 3: SocialBlade Enhancement (When Available)
- Attempts to enhance each profile with SocialBlade verified data
- Adds rankings, grades, and historical statistics
- Gracefully falls back to Apify data when SocialBlade is unavailable

#### Step 4: Brand-Specific Analysis
- Generates personalized match reasons based on brand + influencer combination
- Industry-specific matching (furniture, fashion, fitness, etc.)
- Values-based alignment (sustainability, family, innovation)
- Audience size and platform optimization

#### Step 5: Personalized Content Generation
- Creates unique Spanish biographies for each influencer
- Generates context-aware collaboration descriptions
- Provides realistic metrics and cost estimates

## Current Implementation Status

### ✅ Working Features
- **Colorful Landing Page Animation**: Restored with interactive particle system
- **Real Instagram Data**: Apify integration providing authentic profile data
- **Brand Intelligence**: Automated brand research and analysis
- **Personalized Proposals**: Brand-specific match reasons and biographies
- **Multi-Platform Support**: Instagram, TikTok, YouTube integration
- **Professional Export**: CSV/Excel with Spanish localization

### ⚠️ Known Issues
- **SocialBlade API**: Currently returning 402 errors (payment/quota issues)
  - System falls back to Apify data automatically
  - All functionality remains operational
  - Consider upgrading SocialBlade plan for enhanced analytics

- **Web Search API**: Serply returning 405 errors occasionally
  - Brand research may fail intermittently
  - System continues with basic brand analysis
  - Consider alternative search API providers

### 🔧 Troubleshooting

#### SocialBlade 402 Errors
```
❌ SocialBlade API error: 402
```
**Solutions:**
1. Check your SocialBlade account billing status
2. Verify you haven't exceeded API quotas
3. Consider upgrading to a paid plan
4. The system works fine without SocialBlade (uses Apify data)

#### Web Search 405 Errors
```
❌ Web search error: Error: Serply API error: 405
```
**Solutions:**
1. Check Serply API key validity
2. Verify API endpoint permissions
3. Consider rate limiting issues
4. Brand research will use fallback data

## Example Output Comparison

### Without SocialBlade (Current Fallback)
```
"Su contenido auténtico y engagement sólido lo convierten en un embajador ideal para IKEA. 
Su audiencia demográfica coincide con el target principal de IKEA. 
Datos verificados por Apify con 245,678 seguidores reales."
```

### With SocialBlade (When Working)
```
"Su expertise en diseño de interiores se alinea perfectamente con IKEA. 
Datos verificados por SocialBlade con 245,678 seguidores reales. 
Ranking SocialBlade: #1,234 en seguidores. 
Calificación SocialBlade: A+"
```

## Development Environment

### Required Node.js Version
- Node.js 18+ required
- npm 9+ recommended

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

### Environment Validation
The system automatically validates API credentials on startup and provides fallback behavior for missing or invalid keys.

## Production Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Add all environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables Checklist
- [ ] APIFY_API_TOKEN (Required)
- [ ] SERPLY_API_KEY (Required)
- [ ] FIRECRAWL_API_KEY (Required)
- [ ] All Firebase configuration variables (Required)
- [ ] SOCIALBLADE_CLIENT_ID (Optional)
- [ ] SOCIALBLADE_TOKEN (Optional)

## Next Steps

1. **Resolve SocialBlade API Issues**: Check billing/quota status
2. **Monitor Web Search Reliability**: Consider backup search providers
3. **Test Complete Flow**: Verify end-to-end functionality
4. **Update Documentation**: Keep this guide current with any changes 