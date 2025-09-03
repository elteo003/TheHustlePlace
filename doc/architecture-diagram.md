# 🏗️ Diagrammi Architettura TheHustlePlace

## 📊 Architettura Generale

```mermaid
graph TB
    subgraph "Client Layer"
        A[Browser] --> B[CDN Cache]
        B --> C[Next.js App]
    end
    
    subgraph "Application Layer"
        C --> D[API Routes]
        D --> E[Services Layer]
        E --> F[Cache Layer]
    end
    
    subgraph "External APIs"
        E --> G[TMDB API]
        E --> H[VixSrc API]
    end
    
    subgraph "Cache Layer"
        F --> I[Redis Cache]
        F --> J[In-Memory Cache]
    end
    
    subgraph "Deployment"
        K[Render.com] --> C
        L[Load Balancer] --> K
    end
```

## 🔄 Flusso dei Dati - Homepage

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant C as CDN
    participant R as Redis
    participant T as TMDB API
    participant V as VixSrc API
    
    U->>B: Access Homepage
    B->>C: Check CDN Cache
    C-->>B: Cache Miss
    B->>R: Check Redis Cache
    R-->>B: Cache Miss
    B->>T: Fetch Now Playing Movies
    T-->>B: Movie Data
    B->>V: Fetch Movie IDs
    V-->>B: TMDB IDs
    B->>R: Cache Results
    R-->>B: Cached
    B-->>U: Display Homepage
```

## 🎯 Performance Optimization Flow

```mermaid
graph LR
    subgraph "Request Flow"
        A[User Request] --> B{Rate Limit Check}
        B -->|Pass| C[Cache Check]
        B -->|Fail| D[429 Error]
        C -->|Hit| E[Return Cached]
        C -->|Miss| F[API Call]
        F --> G[Batch Process]
        G --> H[Cache Result]
        H --> I[Return Response]
    end
    
    subgraph "Cache Layers"
        J[Browser Cache<br/>24h] --> K[CDN Cache<br/>7d]
        K --> L[Redis Cache<br/>1h]
        L --> M[In-Memory<br/>Fallback]
    end
```

## 🔍 Search Flow

```mermaid
sequenceDiagram
    participant U as User
    participant S as Search Bar
    participant A as API
    participant T as TMDB
    participant C as Cache
    
    U->>S: Type Query
    S->>A: Debounced Request
    A->>C: Check Cache
    C-->>A: Cache Miss
    A->>T: Search Movies
    T-->>A: Results
    A->>C: Cache Results
    A-->>S: Display Results
    S-->>U: Show Dropdown
```

## 🎬 Video Playback Flow

```mermaid
graph TB
    subgraph "Player Flow"
        A[Movie Click] --> B[Get Player URL]
        B --> C[VixSrc Embed]
        C --> D[Custom Player]
        D --> E[Video Stream]
    end
    
    subgraph "Player Features"
        F[Autoplay Control]
        G[Language Selection]
        H[Quality Settings]
        I[Progress Tracking]
    end
    
    D --> F
    D --> G
    D --> H
    D --> I
```

## 📊 Monitoring Dashboard

```mermaid
graph TB
    subgraph "Metrics Collection"
        A[Performance Metrics] --> B[APM Tool]
        C[User Analytics] --> D[GA4]
        E[Error Tracking] --> F[ELK Stack]
        G[Uptime Monitoring] --> H[Pingdom]
    end
    
    subgraph "Alerting"
        B --> I[High Error Rate]
        D --> J[Slow Performance]
        F --> K[API Failures]
        H --> L[Service Down]
    end
    
    subgraph "Actions"
        I --> M[Auto Scale]
        J --> N[Cache Optimization]
        K --> O[Circuit Breaker]
        L --> P[Failover]
    end
```

## 🚀 Deployment Pipeline

```mermaid
graph LR
    subgraph "CI/CD Pipeline"
        A[Code Push] --> B[GitHub]
        B --> C[Build Trigger]
        C --> D[Type Check]
        D --> E[Lint Check]
        E --> F[Unit Tests]
        F --> G[Build App]
        G --> H[Deploy to Render]
        H --> I[Health Check]
        I --> J[Traffic Switch]
    end
    
    subgraph "Quality Gates"
        K[Code Coverage >80%]
        L[Performance Budget <2MB]
        M[Security Scan Pass]
        N[Accessibility Check]
    end
    
    D --> K
    E --> L
    F --> M
    G --> N
```

## 🔧 Cache Strategy

```mermaid
graph TB
    subgraph "Cache Hierarchy"
        A[Browser Cache<br/>24h TTL] --> B[CDN Cache<br/>7d TTL]
        B --> C[Redis Cache<br/>1h TTL]
        C --> D[In-Memory<br/>Fallback]
    end
    
    subgraph "Cache Invalidation"
        E[TTL Expiry] --> F[LRU Eviction]
        G[Manual Invalidation] --> H[Cache Clear]
        I[Version Update] --> J[Full Refresh]
    end
    
    A --> E
    B --> E
    C --> E
    D --> F
```

## 📈 Scalability Architecture

```mermaid
graph TB
    subgraph "Load Balancing"
        A[User Traffic] --> B[Load Balancer]
        B --> C[Instance 1]
        B --> D[Instance 2]
        B --> E[Instance N]
    end
    
    subgraph "Auto Scaling"
        F[CPU > 70%] --> G[Scale Up]
        H[CPU < 30%] --> I[Scale Down]
        J[Memory > 80%] --> K[Add Instance]
    end
    
    subgraph "Shared Resources"
        L[Redis Cluster] --> M[Session Store]
        N[CDN] --> O[Static Assets]
        P[Database] --> Q[User Data]
    end
```

---

**Nota**: Questi diagrammi rappresentano l'architettura target di TheHustlePlace. Per visualizzarli, copia il codice Mermaid in un editor che supporta la sintassi Mermaid (come Obsidian, GitHub, o Mermaid Live Editor).
