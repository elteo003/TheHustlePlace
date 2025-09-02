'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Menu } from 'lucide-react'

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <nav className="navbar-blur fixed top-0 left-0 right-0 z-50 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">H</span>
                    </div>
                    <span className="text-xl font-bold text-gradient">TheHustlePlace</span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-8">
                    <Link href="/" className="text-white hover:text-blue-400 transition-colors">
                        Home
                    </Link>
                    <Link href="/catalog" className="text-white hover:text-blue-400 transition-colors">
                        Catalogo
                    </Link>
                    <Link href="/movies" className="text-white hover:text-blue-400 transition-colors">
                        Film
                    </Link>
                    <Link href="/tv" className="text-white hover:text-blue-400 transition-colors">
                        Serie TV
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="hidden lg:flex items-center space-x-4 flex-1 max-w-md mx-8">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Cerca film, serie TV..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                        />
                    </div>
                </div>

                {/* User Actions */}
                <div className="flex items-center space-x-4">
                    {/* Mobile Search */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden text-white hover:bg-white/10"
                    >
                        <Search className="w-5 h-5" />
                    </Button>



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
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Cerca film, serie TV..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Link
                                href="/"
                                className="block text-white hover:text-blue-400 transition-colors py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                href="/catalog"
                                className="block text-white hover:text-blue-400 transition-colors py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Catalogo
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
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
