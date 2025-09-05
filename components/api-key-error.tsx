'use client'

import { AlertCircle, ExternalLink } from 'lucide-react'

export function ApiKeyError() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-2xl mx-auto text-center">
                <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-8">
                    <AlertCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />

                    <h1 className="text-2xl font-bold text-white mb-4">
                        Configurazione API Richiesta
                    </h1>

                    <p className="text-gray-300 mb-6">
                        Per utilizzare l'applicazione, devi configurare la TMDB API key.
                    </p>

                    <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
                        <h3 className="text-white font-semibold mb-2">Passaggi da seguire:</h3>
                        <ol className="text-gray-300 space-y-2 text-sm">
                            <li>1. Vai su <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
                                TMDB API Settings <ExternalLink className="w-3 h-3" />
                            </a></li>
                            <li>2. Crea un account gratuito</li>
                            <li>3. Richiedi una API key</li>
                            <li>4. Copia la tua API key</li>
                            <li>5. Modifica il file <code className="bg-gray-700 px-2 py-1 rounded">.env.local</code></li>
                            <li>6. Sostituisci <code className="bg-gray-700 px-2 py-1 rounded">your-tmdb-api-key-here</code> con la tua API key</li>
                            <li>7. Riavvia il server</li>
                        </ol>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
                        <h4 className="text-white font-semibold mb-2">Esempio di configurazione:</h4>
                        <code className="text-green-400 text-sm">
                            TMDB_API_KEY=la_tua_api_key_qui
                        </code>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        Ricarica la pagina
                    </button>
                </div>
            </div>
        </div>
    )
}
