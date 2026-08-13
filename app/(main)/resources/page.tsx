// app/(main)/resources/page.tsx
'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { Book, FileText, Download, ExternalLink } from 'lucide-react'

const resources = [
  {
    id: '1',
    title: 'Morning Bible Study',
    description: 'Study guide for Ephesians',
    type: 'PDF',
    icon: FileText,
  },
  {
    id: '2',
    title: 'Speaker Notes',
    description: 'Notes from Pastor David',
    type: 'PDF',
    icon: FileText,
  },
  {
    id: '3',
    title: 'Bible Study Questions',
    description: 'Discussion questions for groups',
    type: 'PDF',
    icon: FileText,
  },
  {
    id: '4',
    title: 'Retreat Handbook',
    description: 'Complete retreat guide',
    type: 'PDF',
    icon: Book,
  },
]

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-black via-[#1A1A1A] to-brand-black p-4 pb-24">
      <AnimatedSection>
        <h1 className="text-2xl font-bold text-white mb-4">Resources</h1>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <GlassCard dark className="mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-brand-gold/20">
              <Book size={24} className="text-brand-gold" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Today's Materials</h2>
              <p className="text-white/40 text-sm">Day {getCurrentDay()} resources</p>
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>

      <div className="space-y-3">
        {resources.map((resource, index) => (
          <AnimatedSection key={resource.id} delay={0.1 + index * 0.05}>
            <GlassCard dark hover>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-gold/10">
                  <resource.icon size={20} className="text-brand-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{resource.title}</h3>
                  <p className="text-white/40 text-sm">{resource.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white/10 text-white/40 px-2 py-1 rounded-full">
                    {resource.type}
                  </span>
                  <button className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                    <Download size={18} className="text-brand-gold" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={0.4}>
        <p className="text-white/20 text-xs text-center mt-4">
          More resources will be added during the retreat
        </p>
      </AnimatedSection>
    </div>
  )
}

function getCurrentDay() {
  const startDate = new Date('2026-08-13')
  const now = new Date()
  const diff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  return Math.min(Math.max(diff + 1, 1), 5)
}