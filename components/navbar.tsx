'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/search-bar'
import { Menu } from 'lucide-react'

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-black/20 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                        <span className="text-white font-bold text-xl">H</span>
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-500 transition-all duration-300">
                        TheHustlePlace
                    </span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-8">
                    <Link href="/" className="text-white hover:text-blue-400 transition-colors">
                        Home
                    </Link>
                    <Link href="/movies" className="text-white hover:text-blue-400 transition-colors">
                        Film
                    </Link>
                    <Link href="/tv" className="text-white hover:text-blue-400 transition-colors">
                        Serie TV
                    </Link>
                    <Link href="/anime" className="text-white hover:text-blue-400 transition-colors">
                        Anime
                    </Link>
                    <Link href="/request" className="text-white hover:text-blue-400 transition-colors">
                        Richiedi un titolo
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="hidden lg:flex items-center space-x-4 flex-1 max-w-md mx-8">
                    <div className="w-full">
                        <SearchBar />
                    </div>
                </div>

                {/* User Actions */}
                <div className="flex items-center space-x-4">



                    {/* Mobile Menu */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-white hover:bg-white/10"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-t border-white/10">
                    <div className="px-4 py-4 space-y-4">
                        <SearchBar />
                        <div className="space-y-2">
                            <Link
                                href="/"
                                className="block text-white hover:text-blue-400 transition-colors py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                href="/movies"
                                className="block text-white hover:text-blue-400 transition-colors py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Film
                            </Link>
                            <Link
                                href="/tv"
                                className="block text-white hover:text-blue-400 transition-colors py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Serie TV
                            </Link>
                            <Link
                                href="/anime"
                                className="block text-white hover:text-blue-400 transition-colors py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Anime
                            </Link>
                            <Link
                                href="/request"
                                className="block text-white hover:text-blue-400 transition-colors py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Richiedi un titolo
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
