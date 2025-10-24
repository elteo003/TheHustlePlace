'use client'

import React, { createContext, useContext, ReactNode, useState } from 'react'

interface NavbarContextType {
    isVisible: boolean
    setIsVisible: (visible: boolean) => void
    isHovered: boolean
    setIsHovered: (hovered: boolean) => void
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined)

interface NavbarProviderProps {
    children: ReactNode
}

export const NavbarProvider: React.FC<NavbarProviderProps> = ({ children }) => {
    const [isVisible, setIsVisible] = useState(true)
    const [isHovered, setIsHovered] = useState(false)

    const value: NavbarContextType = {
        isVisible,
        setIsVisible,
        isHovered,
        setIsHovered
    }

    return (
        <NavbarContext.Provider value={value}>
            {children}
        </NavbarContext.Provider>
    )
}

export const useNavbarContext = (): NavbarContextType => {
    const context = useContext(NavbarContext)
    if (context === undefined) {
        throw new Error('useNavbarContext must be used within a NavbarProvider')
    }
    return context
}
