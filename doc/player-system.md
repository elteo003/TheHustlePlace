# 🎥 Sistema Player - TheHustlePlace

## 📋 Panoramica

Il sistema Player di TheHustlePlace gestisce la riproduzione di film e serie TV attraverso l'integrazione con VixSrc. Il sistema è progettato per essere robusto, user-friendly e gestire gracefully gli errori.

## 🏗️ Architettura

```
Player System/
├── 🎬 Movie Player          # Player per film
├── 📺 TV Player             # Player per serie TV
├── 🔗 VixSrc Integration    # Integrazione con VixSrc
├── 🛡️ Error Handling        # Gestione errori
├── ⏱️ Timeout Management     # Gestione timeout
└── 🎮 Controls Management   # Gestione controlli
```

## 🎬 Movie Player

### **Caratteristiche Principali**
- ✅ **Integrazione VixSrc**: Player iframe integrato
- ✅ **ID Mapping Corretto**: Usa TMDB ID per VixSrc
- ✅ **Gestione Errori**: Fallback intelligente per contenuti non disponibili
- ✅ **Timeout Management**: Timeout di 30 secondi per caricamento iframe
- ✅ **Controlli Nativi**: Solo controlli di VixSrc, nessuna duplicazione

### **Implementazione**
```typescript
// Player Movie Page
const MoviePlayerPage = () => {
    const [useEmbed, setUseEmbed] = useState(false)
    const [iframeError, setIframeError] = useState(false)
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

    // Caricamento diretto iframe VixSrc
    const loadVideoSource = async () => {
        const tmdbId = parseInt(movieId)
        setUseEmbed(true)
        // Timeout di 30 secondi per VixSrc
    }
}
```

## 📺 TV Player

### **Caratteristiche Principali**
- ✅ **Supporto Stagioni/Episodi**: Gestione completa delle serie TV
- ✅ **Navigazione**: Passaggio tra episodi
- ✅ **Stato Persistente**: Ricorda ultimo episodio visto

### **URL Structure**
```
/player/tv/[tmdbId]?season=1&episode=1
```

## 🔗 VixSrc Integration

### **URL Generation**
```typescript
// VideoPlayerService
getPlayerUrl(tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number): string {
    const baseUrl = type === 'movie'
        ? `${this.VIXSRC_BASE_URL}/movie/${tmdbId}`
        : `${this.VIXSRC_BASE_URL}/tv/${tmdbId}/${season}/${episode}`

    const params = new URLSearchParams({
        lang: 'it',                    // Lingua italiana
        autoplay: 'false',            // Non autoplay
        primaryColor: 'B20710',       // Colore primario (rosso Netflix)
        secondaryColor: '170000'      // Colore secondario
    })

    return `${baseUrl}?${params.toString()}`
}
```

### **Parametri Supportati**
- `lang`: Lingua del player (default: 'it')
- `autoplay`: Autoplay del video (default: 'false')
- `primaryColor`: Colore primario in hex (default: 'B20710')
- `secondaryColor`: Colore secondario in hex (default: '170000')

## 🛡️ Error Handling

### **Sistema di Fallback**
1. **Caricamento Iframe**: Tentativo diretto di caricamento VixSrc
2. **Timeout Detection**: Timeout di 30 secondi per rilevare problemi
3. **Error Page**: Pagina di errore user-friendly con opzioni
4. **Retry Options**: Pulsante per riprovare su VixSrc direttamente

### **Error States**
```typescript
// Stati di errore gestiti
const [iframeError, setIframeError] = useState(false)
const [videoLoading, setVideoLoading] = useState(false)
const [useEmbed, setUseEmbed] = useState(false)
```

### **Error Page Design**
- 🚨 **Icona di errore**: Triangolo di avvertimento
- 📝 **Messaggio chiaro**: Spiegazione del problema
- 🔗 **Link diretto**: Pulsante per VixSrc
- ↩️ **Navigazione**: Pulsante per tornare al catalogo

## ⏱️ Timeout Management

### **Sistema di Timeout**
```typescript
// Timeout di 30 secondi per VixSrc
useEffect(() => {
    if (useEmbed && !iframeError) {
        const timeout = setTimeout(() => {
            setIframeError(true)
            toast({
                title: "Timeout",
                description: "Il player non si è caricato in tempo",
                variant: "destructive"
            })
        }, 30000) // 30 secondi

        return () => clearTimeout(timeout)
    }
}, [useEmbed, iframeError])
```

### **Eventi Iframe**
- `onLoad`: Rileva caricamento riuscito
- `onError`: Rileva errori di caricamento
- **Timeout**: Fallback per iframe che non risponde

## 🎮 Controls Management

### **Controlli Rimossi**
- ❌ **Volume Control**: Rimosso (usa controlli VixSrc)
- ❌ **Play/Pause**: Rimosso (usa controlli VixSrc)
- ❌ **Settings**: Rimosso (usa controlli VixSrc)
- ❌ **Fullscreen**: Rimosso (usa controlli VixSrc)

### **Controlli Mantenuti**
- ✅ **Progress Bar**: Solo per video nativi (non iframe)
- ✅ **Back Button**: Navigazione indietro
- ✅ **Error Controls**: Controlli per gestione errori

## 🔄 ID Mapping System

### **Problema Risolto**
- **Prima**: Usava ID interni per VixSrc (causava 404)
- **Dopo**: Usa TMDB ID corretti per VixSrc

### **Implementazione**
```typescript
// MovieCard, Top10MovieCard, SearchBar
const movieId = 'tmdb_id' in item && item.tmdb_id ? item.tmdb_id : item.id
window.location.href = `/player/movie/${movieId}`
```

### **Fallback Strategy**
```typescript
// Se tmdb_id non disponibile, usa id
const movieId = movie.tmdb_id || movie.id
```

## 📊 API Endpoints

### **Player APIs**
- `GET /api/player/movie/[id]` - Video source per film
- `GET /api/player/tv/[id]` - Video source per serie TV
- `GET /api/player/check-availability` - Verifica disponibilità

### **Availability Check**
```typescript
// Controllo disponibilità (opzionale)
GET /api/player/check-availability?tmdbId=123&type=movie
```

## 🎯 Best Practices

### **Performance**
- ✅ **Lazy Loading**: Iframe caricato solo quando necessario
- ✅ **Timeout Reasonable**: 30 secondi per VixSrc
- ✅ **Error Recovery**: Fallback rapido per errori

### **User Experience**
- ✅ **Loading States**: Indicatori di caricamento chiari
- ✅ **Error Messages**: Messaggi informativi e utili
- ✅ **Navigation**: Opzioni di navigazione sempre disponibili

### **Reliability**
- ✅ **Fallback Strategy**: Sempre un'opzione di recupero
- ✅ **Error Boundaries**: Gestione errori a livello componente
- ✅ **Timeout Management**: Prevenzione di stati bloccati

## 🔧 Troubleshooting

### **Problemi Comuni**

1. **Iframe non si carica**
   - Verifica connessione internet
   - Controlla se VixSrc è accessibile
   - Verifica TMDB ID corretto

2. **Timeout frequenti**
   - Aumenta timeout se necessario
   - Verifica performance VixSrc
   - Controlla firewall/proxy

3. **Errori 404**
   - Verifica mapping ID corretto
   - Controlla se film esiste su VixSrc
   - Usa fallback page

### **Debug**
```typescript
// Log di debug disponibili
console.log('🎬 Caricamento video source per film:', movie.title)
console.log('🆔 TMDB ID utilizzato per vixsrc.to:', tmdbId)
console.log('🔗 URL che verrà generato:', vixsrcUrl)
console.log('✅ Iframe caricato con successo')
console.log('❌ Errore nel caricamento iframe')
```

## 🚀 Future Enhancements

### **Pianificati**
- 📱 **Mobile Optimization**: Ottimizzazioni specifiche mobile
- 🎨 **Custom Themes**: Temi personalizzabili
- 📊 **Analytics**: Tracking utilizzo player
- 🔄 **Offline Support**: Supporto offline limitato

### **Considerazioni**
- 🌐 **Multi-Provider**: Supporto per altri provider streaming
- 🎮 **Advanced Controls**: Controlli avanzati personalizzati
- 📱 **PWA Features**: Funzionalità Progressive Web App

---

**Sistema Player** - Gestione robusta e user-friendly della riproduzione video 🎥✨
