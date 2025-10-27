'use client'

import * as React from 'react'
import Image from 'next/image'
import type { Application } from '@/lib/types/database.types'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'
import type { TabType } from '../types'
import { TabNavigation } from './LeftPanel/TabNavigation'
import { MainPanel } from './MainPanel/MainPanel'
import { ApplicationTimeline } from './RightPanel/ApplicationTimeline'
import { ActionButtons } from './ActionButtons'

interface ApplicationDetailLayoutProps {
  application: Application
  onUpdate: (id: string, data: ApplicationFormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
  isEditMode: boolean
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onEdit: () => void
  onDeleteClick: () => void
}

export function ApplicationDetailLayout({
  application,
  onUpdate: _onUpdate,
  onDelete: _onDelete,
  onClose,
  isEditMode,
  activeTab,
  onTabChange,
  onEdit,
  onDeleteClick,
}: ApplicationDetailLayoutProps) {
  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="glass-ultra border-b border-label-quaternary/20 rounded-t-glass-lg shrink-0">
        {/* Primary Header Info */}
        <div className="flex items-start justify-between gap-4 p-6 pb-2">
          <div className="flex items-center gap-4">
            {application.company_logo_url ? (
              <Image
                src={application.company_logo_url}
                alt={`${application.company_name} logo`}
                width={48}
                height={48}
                className="rounded-lg glass-light border border-label-quaternary/20 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg glass-light border border-label-quaternary/20 flex items-center justify-center bg-copper/10 flex-shrink-0">
                <span className="text-copper font-semibold text-xl">
                  {application.company_name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-label-primary truncate leading-tight">
                {application.job_title}
              </h1>
              <p className="text-lg text-label-secondary truncate leading-tight">
                {application.company_name}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <ActionButtons
            application={application}
            onEdit={onEdit}
            onDelete={onDeleteClick}
            onClose={onClose}
            isDisabled={isEditMode}
          />
        </div>

        {/* Metadata Section */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-6 pb-4 text-sm">
          {/* Location */}
          {application.location && (
            <div className="flex items-center gap-2">
              <span className="text-label-tertiary">📍</span>
              <span className="text-label-primary font-medium">{application.location}</span>
            </div>
          )}

          {/* Salary */}
          {application.salary_range && (
            <div className="flex items-center gap-2">
              <span className="text-label-tertiary">💰</span>
              <span className="text-label-primary font-medium">{application.salary_range}</span>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-label-tertiary">📊</span>
            <span className="text-label-primary font-medium capitalize">
              {application.status.replace('_', ' ')}
            </span>
          </div>

          {/* Date Applied */}
          <div className="flex items-center gap-2">
            <span className="text-label-tertiary">📅</span>
            <span className="text-label-primary font-medium">
              {new Date(application.date_applied).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Source */}
          <div className="flex items-center gap-2">
            <span className="text-label-tertiary">🔗</span>
            <span className="text-label-primary font-medium">
              Added from {application.source || 'external'}
            </span>
          </div>
        </div>
      </div>

      {/* Three Panel Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel - Navigation */}
        <div className="hidden lg:block w-64 shrink-0 border-r border-label-quaternary/20 overflow-y-auto">
          <TabNavigation activeTab={activeTab} onTabChange={onTabChange} disabled={isEditMode} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <MainPanel application={application} activeTab={activeTab} />
        </div>

        {/* Right Panel - Timeline */}
        <div className="hidden xl:block w-80 shrink-0 border-l border-label-quaternary/20 overflow-y-auto">
          <ApplicationTimeline application={application} />
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden border-t border-label-quaternary/20 glass-light">
        <TabNavigation activeTab={activeTab} onTabChange={onTabChange} disabled={isEditMode} />
      </div>
    </div>
  )
}
