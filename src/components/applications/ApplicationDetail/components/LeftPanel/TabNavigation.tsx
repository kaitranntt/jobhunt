'use client'

import * as React from 'react'
import { FileText, Building, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabType } from '../../types'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  disabled?: boolean
}

const tabItems: Array<{
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}> = [
  {
    id: 'overview',
    label: 'Overview',
    icon: FileText,
    description: 'Job description and details',
  },
  {
    id: 'company',
    label: 'Company',
    icon: Building,
    description: 'Company information and research',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FolderOpen,
    description: 'Resume, cover letter, and attachments',
  },
]

export function TabNavigation({ activeTab, onTabChange, disabled = false }: TabNavigationProps) {
  const handleTabClick = React.useCallback(
    (tabId: TabType) => {
      if (!disabled) {
        onTabChange(tabId)
      }
    },
    [disabled, onTabChange]
  )

  return (
    <nav className="p-4 space-y-1" role="tablist">
      {tabItems.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            disabled={disabled}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-glass-sm transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-copper/50 focus:ring-offset-2',
              isActive
                ? 'glass-light bg-copper/10 text-copper border-l-4 border-copper shadow-sm'
                : 'glass-ultra text-label-secondary hover:text-label-primary hover:glass-light',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5 flex-shrink-0',
                isActive ? 'text-copper' : 'text-label-tertiary'
              )}
            />
            <div className="flex-1 text-left">
              <div className={cn('font-medium', isActive ? 'text-copper' : 'text-label-primary')}>
                {tab.label}
              </div>
              <div className="text-xs text-label-tertiary mt-0.5">{tab.description}</div>
            </div>
          </button>
        )
      })}
    </nav>
  )
}
