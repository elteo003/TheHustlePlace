# 🏗️ Diagrammi Architettura TheHustlePlace

## 📋 Panoramica

Questi diagrammi mostrano l'architettura completa del sistema TheHustlePlace, inclusi i flussi di dati, le integrazioni API e l'architettura dei componenti.

## 🎯 Architettura Generale

```mermaid
graph TB
    subgraph "Frontend (Next.js 16)"
        A[Homepage] --> B[Hero Section]
        A --> C[Movie Grids]
        A --> D[Search]
        B --> E[Upcoming Trailers]
        C --> F[Movie Cards]
        D --> G[Search Results]
    end
    
    subgraph "API Layer"
        H[TMDB API] --> I[Movie Details]
        H --> J[Videos/Trailers]
        K[VixSrc API] --> L[Streaming URLs]
        M[Trakt.tv API] --> N[Popular Movies]
    end
    
    subgraph "Player System"
        O[Movie Player] --> P[Video Player]
        Q[TV Player] --> R[Episode Controls]
        P --> S[YouTube Integration]
    end
    
    subgraph "Data Flow"
        T[User Interaction] --> U[API Calls]
        U --> V[Data Processing]
        V --> W[UI Updates]
    end
    
    A --> H
    A --> K
    A --> M
    F --> O
    F --> Q
    T --> A
```

## 🔄 Flusso Dati Homepage

```mermaid
sequenceDiagram
    participant U as User
    participant H as Homepage
    participant T as TMDB API
    participant V as VixSrc API
    participant P as Player
    
    U->>H: Visita homepage
    H->>T: Richiedi film popolari
    T-->>H: Lista film + metadati
    H->>T: Richiedi trailer per film hero
    T-->>H: URL trailer YouTube
    H->>V: Verifica disponibilità streaming
    V-->>H: URL streaming disponibile
    H->>U: Mostra homepage completa
    
    U->>H: Click su film
    H->>P: Naviga al player
    P->>V: Carica URL streaming
    V-->>P: Iframe VixSrc
    P->>U: Mostra player
```

## 🎬 Sistema Player

```mermaid
graph LR
    subgraph "Player Architecture"
        A[Movie Player] --> B[Video Source]
        A --> C[Controls]
        A --> D[Progress Tracking]
        
        B --> E[VixSrc Iframe]
        B --> F[YouTube Trailer]
        B --> G[Direct Video]
        
        C --> H[Play/Pause]
        C --> I[Volume]
        C --> J[Fullscreen]
        
        D --> K[Local Storage]
        D --> L[Analytics]
    end
    
    subgraph "Data Sources"
        M[TMDB] --> N[Movie Metadata]
        O[VixSrc] --> P[Streaming URLs]
        Q[YouTube] --> R[Trailers]
    end
    
    A --> M
    A --> O
    A --> Q
```

## 🔍 Sistema di Ricerca

```mermaid
flowchart TD
    A[User Input] --> B[Debounced Search]
    B --> C{Search Type}
    
    C -->|Movies| D[TMDB Movie Search]
    C -->|TV Shows| E[TMDB TV Search]
    C -->|All| F[Combined Search]
    
    D --> G[Filter Results]
    E --> G
    F --> G
    
    G --> H[Check VixSrc Availability]
    H --> I[Format Results]
    I --> J[Display to User]
    
    K[Search History] --> L[Local Storage]
    J --> K
```

## 🎨 Architettura Componenti

```mermaid
graph TB
    subgraph "Layout Components"
        A[RootLayout] --> B[Navbar]
        A --> C[ConditionalLayout]
        C --> D[HomePage]
        C --> E[PlayerPage]
    end
    
    subgraph "Homepage Components"
        D --> F[HeroSection]
        D --> G[MovieGridIntegrated]
        F --> H[UpcomingTrailersSection]
        F --> I[Navbar]
    end
    
    subgraph "Player Components"
        E --> J[MoviePlayer]
        E --> K[TVPlayer]
        J --> L[VideoPlayer]
        K --> M[EpisodeControls]
    end
    
    subgraph "Shared Components"
        N[MovieCard] --> O[MoviePreview]
        P[SearchBar] --> Q[SearchResults]
        R[Button] --> S[LoadingSpinner]
    end
    
    F --> N
    G --> N
    D --> P
```

## 🔧 Integrazione API

```mermaid
graph LR
    subgraph "External APIs"
        A[TMDB API] --> B[Movie Data]
        A --> C[TV Data]
        A --> D[Images]
        A --> E[Videos]
        
        F[VixSrc] --> G[Streaming URLs]
        F --> H[Availability Check]
        
        I[Trakt.tv] --> J[Popular Content]
        I --> K[Trending Data]
    end
    
    subgraph "Internal APIs"
        L[/api/tmdb/movies] --> M[Movie Details]
        N[/api/player/movie] --> O[Streaming Data]
        P[/api/catalog] --> Q[Combined Data]
    end
    
    subgraph "Frontend"
        R[Homepage] --> L
        R --> N
        R --> P
        S[Player] --> N
        T[Search] --> L
    end
    
    A --> L
    F --> N
    I --> P
```

## 🚀 Flusso Performance

```mermaid
graph TD
    A[User Request] --> B{Cache Check}
    B -->|Hit| C[Return Cached Data]
    B -->|Miss| D[API Call]
    
    D --> E[Data Processing]
    E --> F[Cache Update]
    F --> G[Return Data]
    
    H[Background Tasks] --> I[Preload Popular Content]
    I --> J[Update Cache]
    
    K[Error Handling] --> L[Fallback Data]
    K --> M[Retry Logic]
    
    C --> N[Fast Response]
    G --> N
    L --> N
```

## 🎯 Sistema di Stati

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Success: Data Loaded
    Loading --> Error: API Failed
    Error --> Loading: Retry
    Success --> Playing: User Clicks Play
    Success --> Searching: User Searches
    Playing --> Paused: User Pauses
    Paused --> Playing: User Resumes
    Playing --> Ended: Video Ends
    Ended --> Success: Return to Homepage
    Searching --> Success: Search Complete
```

## 🔐 Sistema di Autenticazione (Futuro)

```mermaid
graph TB
    subgraph "Authentication Flow"
        A[User Login] --> B[OAuth Provider]
        B --> C[Token Generation]
        C --> D[Session Management]
        D --> E[Protected Routes]
    end
    
    subgraph "User Management"
        F[User Profile] --> G[Watchlist]
        F --> H[Viewing History]
        F --> I[Preferences]
    end
    
    subgraph "Content Access"
        J[Free Content] --> K[Public Access]
        L[Premium Content] --> M[Subscription Required]
        N[Personalized] --> O[User Data Required]
    end
    
    E --> F
    E --> J
    E --> L
    E --> N
```

## 📊 Monitoraggio e Analytics

```mermaid
graph LR
    subgraph "Data Collection"
        A[User Interactions] --> B[Event Tracking]
        C[Video Playback] --> D[Progress Tracking]
        E[Search Queries] --> F[Search Analytics]
    end
    
    subgraph "Processing"
        B --> G[Data Aggregation]
        D --> G
        F --> G
        G --> H[Analytics Dashboard]
    end
    
    subgraph "Insights"
        H --> I[Popular Content]
        H --> J[User Behavior]
        H --> K[Performance Metrics]
    end
    
    subgraph "Optimization"
        I --> L[Content Recommendations]
        J --> M[UI Improvements]
        K --> N[Performance Tuning]
    end
```

## 🎨 Design System

```mermaid
graph TB
    subgraph "Design Tokens"
        A[Colors] --> B[Primary Palette]
        A --> C[Secondary Palette]
        A --> D[Neutral Palette]
    end
    
    subgraph "Typography"
        E[Fonts] --> F[Headings]
        E --> G[Body Text]
        E --> H[UI Text]
    end
    
    subgraph "Components"
        I[Buttons] --> J[Primary]
        I --> K[Secondary]
        I --> L[Ghost]
        M[Cards] --> N[Movie Card]
        M --> O[Info Card]
        P[Layout] --> Q[Grid System]
        P --> R[Spacing]
    end
    
    subgraph "Animations"
        S[Transitions] --> T[Hover Effects]
        S --> U[Page Transitions]
        S --> V[Loading States]
    end
```

## 🔄 Deployment Pipeline

```mermaid
graph LR
    A[Code Commit] --> B[GitHub Actions]
    B --> C[Build Process]
    C --> D[Test Suite]
    D --> E{Tests Pass?}
    E -->|Yes| F[Deploy to Staging]
    E -->|No| G[Fix Issues]
    G --> A
    F --> H[Staging Tests]
    H --> I{Staging OK?}
    I -->|Yes| J[Deploy to Production]
    I -->|No| K[Rollback]
    J --> L[Production Monitoring]
    K --> A
```

---

**🎯 Questi diagrammi forniscono una visione completa dell'architettura di TheHustlePlace, mostrando come tutti i componenti interagiscono per creare un'esperienza di streaming fluida e performante.**
