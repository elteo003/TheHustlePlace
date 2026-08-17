export function SectionLoading() {
    return (
        <div className="min-h-screen bg-black">
            <main className="pt-8 pb-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="h-8 w-40 rounded-md shimmer mb-8" />
                    <div className="space-y-10">
                        {[0, 1, 2].map((row) => (
                            <div key={row}>
                                <div className="h-6 w-48 rounded-md shimmer mb-6" />
                                <div className="flex gap-4 overflow-hidden">
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex-shrink-0 w-[140px] aspect-[2/3] rounded-lg shimmer"
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
