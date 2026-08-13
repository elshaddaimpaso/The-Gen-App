// components/ui/GoldButton.tsx
'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GoldButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'solid' | 'outline'
  className?: string
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

export function GoldButton({
  children,
  onClick,
  type = 'button',
  variant = 'solid',
  className = '',
  loading = false,
  disabled = false,
  fullWidth = false,
}: GoldButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        ${variant === 'solid' ? 'btn-gold' : 'btn-gold-outline'}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}