'use client'

import * as React from 'react'
import { Check, Clock, Calendar, DollarSign, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application, ApplicationStatus } from '@/lib/types/database.types'

interface PipelineTrackerProps {
  applications: Application[]
  className?: string
}

interface PipelineStage {
  id: ApplicationStatus
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ComponentType<{ className?: string }>
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'wishlist',
    label: 'Bookmarked',
    description: "Jobs you're interested in",
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: Star,
  },
  {
    id: 'applied',
    label: 'Applied',
    description: 'Applications submitted',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: Check,
  },
  {
    id: 'phone_screen',
    label: 'Phone Screen',
    description: 'Initial conversations',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    icon: Clock,
  },
  {
    id: 'interviewing',
    label: 'Interviewing',
    description: 'Active interviews',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    icon: Calendar,
  },
  {
    id: 'offered',
    label: 'Offered',
    description: 'Job offers received',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: DollarSign,
  },
]

const StageCard = ({
  stage,
  count,
  isActive,
  isCompleted,
  onClick,
}: {
  stage: PipelineStage
  count: number
  isActive: boolean
  isCompleted: boolean
  onClick: () => void
}) => {
  const Icon = stage.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center p-2 sm:p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md min-w-[100px] sm:min-w-[120px] flex-1',
        isActive
          ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
          : isCompleted
            ? 'border-green-200 bg-green-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center mb-2',
          isActive
            ? 'bg-blue-500 text-white'
            : isCompleted
              ? 'bg-green-500 text-white'
              : stage.bgColor
        )}
      >
        <Icon className={cn('h-6 w-6', isActive || isCompleted ? 'text-white' : stage.color)} />
      </div>

      <div className="text-center">
        <div
          className={cn('font-semibold text-sm mb-1', isActive ? 'text-blue-700' : 'text-gray-900')}
        >
          {stage.label}
        </div>
        <div className={cn('text-xl font-bold mb-1', isActive ? 'text-blue-600' : 'text-gray-700')}>
          {count}
        </div>
        <div className="text-xs text-gray-500 leading-tight hidden sm:block">
          {stage.description}
        </div>
      </div>
    </button>
  )
}

const ConnectingLine = ({ isActive, isCompleted }: { isActive: boolean; isCompleted: boolean }) => (
  <div
    className={cn(
      'flex-1 h-0.5 mx-2 transition-colors duration-300',
      isActive || isCompleted ? 'bg-blue-300' : 'bg-gray-200'
    )}
  />
)

export function PipelineTracker({ applications, className }: PipelineTrackerProps) {
  const [selectedStage, setSelectedStage] = React.useState<ApplicationStatus | null>(null)

  // Count applications by stage
  const stageCounts = React.useMemo(() => {
    const counts = PIPELINE_STAGES.reduce(
      (acc, stage) => {
        acc[stage.id] = 0
        return acc
      },
      {} as Record<ApplicationStatus, number>
    )

    applications.forEach(app => {
      if (app.status in counts) {
        counts[app.status]++
      }
    })

    return counts
  }, [applications])

  // Find current active stage (first non-zero count)
  const activeStageIndex = React.useMemo(() => {
    return PIPELINE_STAGES.findIndex(stage => stageCounts[stage.id] > 0)
  }, [stageCounts])

  return (
    <div
      className={cn('w-full p-6 bg-white rounded-xl border border-gray-200 shadow-sm', className)}
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Application Pipeline</h2>
        <p className="text-sm text-gray-600">Track your job search progress through each stage</p>
      </div>

      <div className="flex items-center justify-between overflow-x-auto pb-4 gap-1">
        {PIPELINE_STAGES.map((stage, index) => {
          const count = stageCounts[stage.id]
          const isActive = index === activeStageIndex && count > 0
          const isCompleted = index < activeStageIndex && count > 0
          const isSelected = selectedStage === stage.id

          return (
            <React.Fragment key={stage.id}>
              {index > 0 && (
                <ConnectingLine isActive={isActive || isSelected} isCompleted={isCompleted} />
              )}
              <StageCard
                stage={stage}
                count={count}
                isActive={isActive || isSelected}
                isCompleted={isCompleted}
                onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
              />
            </React.Fragment>
          )
        })}
      </div>

      {/* Stage Details */}
      {selectedStage && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              {PIPELINE_STAGES.find(s => s.id === selectedStage)?.label} Applications
            </h3>
            <button
              onClick={() => setSelectedStage(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="text-sm text-gray-600 mb-3">
            {stageCounts[selectedStage]} application{stageCounts[selectedStage] !== 1 ? 's' : ''} in
            this stage
          </div>

          {applications
            .filter(app => app.status === selectedStage)
            .slice(0, 5)
            .map(app => (
              <div
                key={app.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <div className="font-medium text-gray-900">{app.job_title}</div>
                  <div className="text-sm text-gray-500">{app.company_name}</div>
                </div>
                <div className="text-sm text-gray-400">
                  {app.date_applied && new Date(app.date_applied).toLocaleDateString()}
                </div>
              </div>
            ))}

          {applications.filter(app => app.status === selectedStage).length > 5 && (
            <div className="text-sm text-blue-600 mt-2 hover:text-blue-700 cursor-pointer">
              View all {stageCounts[selectedStage]} applications →
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="text-center p-2.5 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {
              applications.filter(app =>
                ['applied', 'phone_screen', 'interviewing'].includes(app.status)
              ).length
            }
          </div>
          <div className="text-xs text-blue-700">Active Applications</div>
        </div>

        <div className="text-center p-2.5 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {applications.filter(app => app.status === 'offered').length}
          </div>
          <div className="text-xs text-green-700">Offers Received</div>
        </div>

        <div className="text-center p-2.5 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {
              applications.filter(app => ['phone_screen', 'interviewing'].includes(app.status))
                .length
            }
          </div>
          <div className="text-xs text-yellow-700">In Process</div>
        </div>

        <div className="text-center p-2.5 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {
              applications.filter(app => ['rejected', 'withdrawn', 'ghosted'].includes(app.status))
                .length
            }
          </div>
          <div className="text-xs text-gray-700">Not Moving Forward</div>
        </div>
      </div>
    </div>
  )
}

PipelineTracker.displayName = 'PipelineTracker'
