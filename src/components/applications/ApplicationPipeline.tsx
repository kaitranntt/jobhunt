'use client'

import * as React from 'react'
import { Bookmark, Send, Users, Trophy, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface ApplicationPipelineProps {
  applications: Application[]
  className?: string
}

interface PipelineStageProps {
  icon: React.ReactNode
  count: number
  label: string
  color: string
  isLast?: boolean
}

const PipelineStage = ({ icon, count, label, color, isLast = false }: PipelineStageProps) => {
  return (
    <div className="flex flex-col items-center w-[18%]">
      <div
        className="w-[50px] h-[50px] rounded-full flex items-center justify-center mb-2 text-white shadow-lg"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <div
        className="text-[20px] font-bold mb-1"
        style={{
          fontFamily: 'var(--font-libre-baskerville)',
          color: 'var(--text-primary)',
        }}
      >
        {count}
      </div>
      <div
        className="text-[12px] text-center"
        style={{
          fontFamily: 'var(--font-lora)',
          color: 'var(--text-primary)',
        }}
      >
        {label}
      </div>
      {!isLast && (
        <div className="flex-grow h-2 mt-2 relative">
          <div className="absolute inset-0" style={{ backgroundColor: 'var(--border-color)' }} />
          <div
            className="absolute right-0 top-[-4px] w-0 h-0"
            style={{
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: `8px solid var(--border-color)`,
            }}
          />
        </div>
      )}
    </div>
  )
}

export function ApplicationPipeline({ applications, className }: ApplicationPipelineProps) {
  // Count applications by stage
  const stageCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      saved: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
    }

    applications.forEach(app => {
      switch (app.status) {
        case 'wishlist':
          counts.saved++
          break
        case 'applied':
          counts.applied++
          break
        case 'phone_screen':
        case 'assessment':
        case 'take_home':
        case 'interviewing':
        case 'final_round':
          counts.interviewing++
          break
        case 'offered':
        case 'accepted':
          counts.offer++
          break
        case 'rejected':
        case 'withdrawn':
        case 'ghosted':
          counts.rejected++
          break
      }
    })

    return counts
  }, [applications])

  return (
    <div
      className={cn('glass-medium rounded-glass shadow-glass-soft p-5', className)}
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      <h2
        className="text-[18px] font-bold mb-4"
        style={{
          fontFamily: 'var(--font-libre-baskerville)',
          color: 'var(--text-primary)',
        }}
      >
        Application Pipeline
      </h2>
      <div className="flex justify-between items-center">
        <PipelineStage
          icon={<Bookmark className="h-5 w-5" />}
          count={stageCounts.saved}
          label="Saved"
          color="var(--saved-color)"
        />
        <PipelineStage
          icon={<Send className="h-5 w-5" />}
          count={stageCounts.applied}
          label="Applied"
          color="var(--applied-color)"
        />
        <PipelineStage
          icon={<Users className="h-5 w-5" />}
          count={stageCounts.interviewing}
          label="Interviewing"
          color="var(--interviewing-color)"
        />
        <PipelineStage
          icon={<Trophy className="h-5 w-5" />}
          count={stageCounts.offer}
          label="Offer"
          color="var(--offer-color)"
        />
        <PipelineStage
          icon={<X className="h-5 w-5" />}
          count={stageCounts.rejected}
          label="Rejected"
          color="var(--rejected-color)"
          isLast={true}
        />
      </div>
    </div>
  )
}

ApplicationPipeline.displayName = 'ApplicationPipeline'
