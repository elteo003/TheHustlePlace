export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug'
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development'

    private formatMessage(level: LogLevel, message: string, data?: any): string {
        const timestamp = new Date().toISOString()
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`

        if (data) {
            return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`
        }

        return `${prefix} ${message}`
    }

    private log(level: LogLevel, message: string, data?: any): void {
        if (!this.isDevelopment && level === LogLevel.DEBUG) {
            return
        }

        const formattedMessage = this.formatMessage(level, message, data)

        switch (level) {
            case LogLevel.ERROR:
                console.error(formattedMessage)
                break
            case LogLevel.WARN:
                console.warn(formattedMessage)
                break
            case LogLevel.INFO:
                console.info(formattedMessage)
                break
            case LogLevel.DEBUG:
                console.debug(formattedMessage)
                break
        }
    }

    error(message: string, data?: any): void {
        this.log(LogLevel.ERROR, message, data)
    }

    warn(message: string, data?: any): void {
        this.log(LogLevel.WARN, message, data)
    }

    info(message: string, data?: any): void {
        this.log(LogLevel.INFO, message, data)
    }

    debug(message: string, data?: any): void {
        this.log(LogLevel.DEBUG, message, data)
    }
}

export const logger = new Logger()
