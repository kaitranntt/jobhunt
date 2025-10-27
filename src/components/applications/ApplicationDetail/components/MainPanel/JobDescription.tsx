'use client'

import * as React from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface JobDescriptionProps {
  application: Application
  className?: string
}

export function JobDescription({ application, className }: JobDescriptionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Job URL */}
      {application.job_url && (
        <section className="glass-ultra rounded-glass-sm p-6">
          <h3 className="text-lg font-semibold text-label-primary mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-copper" />
            Job Posting
          </h3>
          <a
            href={application.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-copper hover:text-copper/80 transition-colors duration-200 font-medium"
          >
            View Original Job Posting
            <ExternalLink className="w-4 h-4" />
          </a>
        </section>
      )}

      {/* Job Description */}
      {application.job_description && (
        <section className="glass-ultra rounded-glass-sm p-6">
          <h3 className="text-lg font-semibold text-label-primary mb-4">Job Description</h3>
          <div
            className="prose prose-sm max-w-none text-label-primary"
            dangerouslySetInnerHTML={{ __html: application.job_description }}
          />
        </section>
      )}

      {/* Notes */}
      {application.notes && (
        <section className="glass-ultra rounded-glass-sm p-6">
          <h3 className="text-lg font-semibold text-label-primary mb-4">Notes</h3>
          <div className="prose prose-sm max-w-none text-label-primary whitespace-pre-wrap">
            {application.notes}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!application.job_description && !application.notes && !application.job_url && (
        <section className="glass-ultra rounded-glass-sm p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full glass-light border border-label-quaternary/20 flex items-center justify-center">
              <span className="text-2xl text-label-tertiary">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-label-primary">No Details Available</h3>
            <p className="text-label-secondary max-w-md">
              This application doesn't have any job description or notes yet.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
