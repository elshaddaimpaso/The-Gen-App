// components/ui/GlassCard.tsx
'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  dark?: boolean
  hover?: boolean
  delay?: number
  onClick?: () => void
}

export function GlassCard({ 
  children, 
  className = '', 
  dark = false,
  hover = true,
  delay = 0,
  onClick
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={`
        ${dark ? 'glass-card-dark' : 'glass-card'}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}