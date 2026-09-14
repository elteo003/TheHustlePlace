export function firstFulfilled<T>(tasks: Promise<T>[]): Promise<T> {
    return new Promise((resolve, reject) => {
        let pending = tasks.length
        let lastError: unknown = new Error('Nessun risultato')
        if (pending === 0) {
            reject(lastError)
            return
        }
        for (const task of tasks) {
            task.then(resolve, (error) => {
                lastError = error
                pending -= 1
                if (pending === 0) reject(lastError)
            })
        }
    })
}
