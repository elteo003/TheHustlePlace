export default function HomeLoading() {
    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none pointer-events-auto">
            <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-lg shadow-white/10">
                    <span className="text-black font-bold text-2xl">H</span>
                </div>
                <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
                    TheHustlePlace
                </h1>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-10">
                    Streaming
                </p>
            </div>

            <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-white/80 rounded-full"
                    style={{
                        width: '0%',
                        animation: 'splashLoading 2.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                />
            </div>
            <style>{`
                @keyframes splashLoading {
                    0% { width: 0%; }
                    100% { width: 80%; }
                }
            `}</style>
        </div>
    )
}
