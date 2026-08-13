// components/ui/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Calendar, User, LifeBuoy, BookOpen } from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Calendar, label: 'Programme', href: '/programme' },
  { icon: User, label: 'Me', href: '/me' },
  { icon: BookOpen, label: 'Resources', href: '/resources' },
  { icon: LifeBuoy, label: 'Help', href: '/help' },
]

export function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login' || pathname === '/register' || pathname === '/dashboard') {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#D4AF37]/10 px-2 py-2 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-0.5 group py-1 px-2 rounded-lg transition-all duration-300"
            >
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                <Icon
                  size={24}
                  className={`transition-all duration-300 ${
                    isActive 
                      ? 'text-[#D4AF37] drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]' 
                      : 'text-gray-500 group-hover:text-[#D4AF37]/70'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.6)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.div>
              <span
                className={`text-[10px] font-medium transition-all duration-300 ${
                  isActive ? 'text-[#D4AF37]' : 'text-gray-500 group-hover:text-[#D4AF37]/70'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}