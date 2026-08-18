'use client'

import { useState } from 'react'
import { DeviceCodeDialog } from '@/components/device-code-dialog'

export function DeviceCodeButton() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="h-8 flex-shrink-0 rounded-md px-2.5 text-[13px] font-medium text-white/50 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white"
            >
                Codice
            </button>
            <DeviceCodeDialog open={open} onClose={() => setOpen(false)} />
        </>
    )
}
