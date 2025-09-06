'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
    errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
        this.setState({
            error,
            errorInfo
        })
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-8">
                    <div className="text-center max-w-2xl mx-auto">
                        <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mb-8 mx-auto backdrop-blur-sm">
                            <AlertTriangle className="w-16 h-16 text-red-400" />
                        </div>

                        <h1 className="text-4xl font-bold mb-4 text-white">
                            Oops! Qualcosa è andato storto
                        </h1>

                        <p className="text-xl text-gray-300 mb-6">
                            Si è verificato un errore durante il caricamento del player video.
                        </p>

                        <div className="bg-gray-800/50 rounded-lg p-4 mb-8 text-left">
                            <h3 className="text-lg font-semibold text-white mb-2">Dettagli errore:</h3>
                            <p className="text-red-400 text-sm font-mono break-all">
                                {this.state.error?.message || 'Errore sconosciuto'}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                onClick={this.handleRetry}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Riprova
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => window.location.reload()}
                                className="border-white/30 text-white hover:bg-white/10"
                            >
                                Ricarica pagina
                            </Button>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details className="mt-8 text-left">
                                <summary className="text-gray-400 cursor-pointer hover:text-white">
                                    Stack trace (solo in sviluppo)
                                </summary>
                                <pre className="mt-4 p-4 bg-gray-900 rounded text-xs text-gray-300 overflow-auto">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

// Hook per gestire errori nei componenti funzionali
export function useErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null)

    const resetError = React.useCallback(() => {
        setError(null)
    }, [])

    const captureError = React.useCallback((error: Error) => {
        console.error('Error captured by useErrorHandler:', error)
        setError(error)
    }, [])

    React.useEffect(() => {
        if (error) {
            throw error
        }
    }, [error])

    return { captureError, resetError }
}


