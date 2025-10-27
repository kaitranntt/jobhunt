'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { TabType } from '../../types'
import type { Application } from '@/lib/types/database.types'
import { JobDescription } from './JobDescription'
import { CompanyInfo } from './CompanyInfo'
import { Documents } from './Documents'

interface MainPanelProps {
  application: Application
  activeTab: TabType
  className?: string
}

export function MainPanel({ application, activeTab, className }: MainPanelProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <JobDescription application={application} />
      case 'company':
        return <CompanyInfo application={application} />
      case 'documents':
        return <Documents _application={application} />
      default:
        return <JobDescription application={application} />
    }
  }

  return (
    <div
      id={`${activeTab}-panel`}
      role="tabpanel"
      aria-labelledby={`${activeTab}-tab`}
      className={cn('p-6 overflow-y-auto', className)}
    >
      {renderContent()}
    </div>
  )
}
