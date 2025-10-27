'use client'

import * as React from 'react'
import { FileText, Upload, Link, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Application } from '@/lib/types/database.types'

interface DocumentsProps {
  _application: Application
  className?: string
}

export function Documents({ _application, className }: DocumentsProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="glass-ultra border-copper/30 text-copper hover:bg-copper/10 hover:border-copper/50"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
        <Button
          variant="outline"
          className="glass-ultra border-copper/30 text-copper hover:bg-copper/10 hover:border-copper/50"
        >
          <Link className="w-4 h-4 mr-2" />
          Link Document
        </Button>
      </div>

      {/* Coming Soon Banner */}
      <div className="glass-light bg-copper/10 border border-copper/30 rounded-glass-sm p-6 text-center">
        <FileText className="w-12 h-12 text-copper mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-label-primary mb-2">Document Management</h3>
        <p className="text-label-secondary">
          Document management features coming soon. This will include resume uploads, cover letters,
          and application attachments.
        </p>
      </div>

      {/* Document Categories Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="glass-ultra rounded-glass-sm p-6">
          <h3 className="text-lg font-semibold text-label-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-copper" />
            Resume
          </h3>
          <div className="text-center py-8">
            <Plus className="w-8 h-8 text-label-tertiary mx-auto mb-2" />
            <p className="text-sm text-label-secondary">Upload your resume for this application</p>
          </div>
        </section>

        <section className="glass-ultra rounded-glass-sm p-6">
          <h3 className="text-lg font-semibold text-label-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-copper" />
            Cover Letter
          </h3>
          <div className="text-center py-8">
            <Plus className="w-8 h-8 text-label-tertiary mx-auto mb-2" />
            <p className="text-sm text-label-secondary">Add a custom cover letter</p>
          </div>
        </section>
      </div>

      {/* Feature Preview */}
      <section className="glass-ultra rounded-glass-sm p-6 opacity-60">
        <h3 className="text-lg font-semibold text-label-primary mb-4">Coming Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-label-tertiary" />
            <span className="text-sm text-label-secondary">Multiple document support</span>
          </div>
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-label-tertiary" />
            <span className="text-sm text-label-secondary">PDF, DOC, DOCX formats</span>
          </div>
          <div className="flex items-center gap-3">
            <Link className="w-5 h-5 text-label-tertiary" />
            <span className="text-sm text-label-secondary">Cloud storage integration</span>
          </div>
          <div className="flex items-center gap-3">
            <Plus className="w-5 h-5 text-label-tertiary" />
            <span className="text-sm text-label-secondary">Document templates</span>
          </div>
        </div>
      </section>
    </div>
  )
}
