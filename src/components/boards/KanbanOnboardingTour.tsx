'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { X, ArrowRight, ArrowLeft, Settings, BarChart3, Plus, Download } from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  target: string // CSS selector or data-testid
  action?: string
  icon?: React.ReactNode
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Enhanced Kanban Board! 🎉',
    description:
      "Your kanban board has been upgraded with powerful new features. Let's take a quick tour to explore what's new.",
    target: '[data-testid="kanban-dnd-context"]',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    id: 'custom-columns',
    title: 'Custom Columns',
    description:
      'Create columns that match your workflow. Add custom stages like "Technical Assessment" or "Final Interview" with specific WIP limits.',
    target: '[data-testid="board-column-1"]',
    action: 'Click the column menu (⋮) to edit or delete columns',
    icon: <Plus className="h-5 w-5" />,
  },
  {
    id: 'wip-limits',
    title: 'WIP (Work in Progress) Limits',
    description:
      "Set limits to manage your workflow capacity. Green means you're good, yellow means you're near capacity, and red means you're over limit.",
    target: '[data-testid="wip-indicator"]',
    action: 'Hover over limits to see your current capacity',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    description:
      'Track your conversion rates, pipeline health, and application trends. Get insights into your job search performance.',
    target: '[data-testid="analytics-button"]',
    action: 'Click Analytics to view your job search metrics',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    id: 'export',
    title: 'Export Your Data',
    description:
      'Export your board data as JSON or CSV for backup, analysis, or sharing with career coaches.',
    target: '[data-testid="export-json-button"]',
    action: 'Export your data regularly for safekeeping',
    icon: <Download className="h-5 w-5" />,
  },
  {
    id: 'board-settings',
    title: 'Board Settings',
    description:
      'Customize your board appearance, enable compact mode, set up auto-archiving, and configure display options.',
    target: '[data-testid="settings-button"]',
    action: 'Personalize your board to match your preferences',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Navigation',
    description:
      'Use arrow keys to navigate between columns and applications. Press Enter or Space to open application details. Press Escape to cancel dragging.',
    target: '[data-testid="kanban-dnd-context"]',
    action: 'Try navigating with arrow keys right now!',
    icon: <ArrowRight className="h-5 w-5" />,
  },
  {
    id: 'mobile-responsive',
    title: 'Mobile Friendly',
    description:
      'Your kanban board works perfectly on mobile devices! Columns stack vertically on smaller screens, and all features are touch-optimized.',
    target: '[data-testid="kanban-dnd-context"]',
    action: 'Try resizing your browser or viewing on mobile',
    icon: <Plus className="h-5 w-5" />,
  },
  {
    id: 'complete',
    title: "You're All Set! 🚀",
    description:
      "You've learned about all the enhanced features. Start customizing your board and tracking your job search more effectively.",
    target: '[data-testid="kanban-dnd-context"]',
    action: 'Happy job hunting with your enhanced kanban board!',
    icon: <BarChart3 className="h-5 w-5" />,
  },
]

interface KanbanOnboardingTourProps {
  isOpen: boolean
  onClose: () => void
  onStartTour?: () => void
  completedSteps?: string[]
}

export function KanbanOnboardingTour({ isOpen, onClose, onStartTour }: KanbanOnboardingTourProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [isTourActive, setIsTourActive] = React.useState(false)

  const handleStartTour = () => {
    setIsTourActive(true)
    setCurrentStep(0)
    onStartTour?.()
  }

  const handleNextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleCompleteTour()
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleCompleteTour = () => {
    setIsTourActive(false)
    onClose()
    // Save completion to localStorage
    localStorage.setItem('kanban-onboarding-completed', 'true')
    localStorage.setItem('kanban-onboarding-date', new Date().toISOString())
  }

  const handleSkipTour = () => {
    setIsTourActive(false)
    onClose()
  }

  const currentStepData = onboardingSteps[currentStep]
  const isLastStep = currentStep === onboardingSteps.length - 1
  const isFirstStep = currentStep === 0

  React.useEffect(() => {
    // Highlight the target element when tour is active
    if (isTourActive && currentStepData.target) {
      const targetElement = document.querySelector(currentStepData.target)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        targetElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2')

        // Remove highlight after 3 seconds
        const timer = setTimeout(() => {
          targetElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
        }, 3000)

        return () => clearTimeout(timer)
      }
    }
  }, [currentStep, isTourActive])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentStepData.icon}
              <DialogTitle className="text-lg">{currentStepData.title}</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <DialogDescription className="text-base leading-relaxed">
            {currentStepData.description}
          </DialogDescription>

          {currentStepData.action && (
            <div className="bg-muted/50 rounded-lg p-3 border">
              <p className="text-sm font-medium text-muted-foreground">
                💡 {currentStepData.action}
              </p>
            </div>
          )}

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-1 py-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-primary'
                    : index < currentStep
                      ? 'bg-primary/60'
                      : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step counter */}
          <div className="text-center text-sm text-muted-foreground">
            Step {currentStep + 1} of {onboardingSteps.length}
          </div>

          {/* Action buttons */}
          {!isTourActive ? (
            <div className="flex flex-col gap-2">
              <Button onClick={handleStartTour} className="w-full">
                Start Tour
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Maybe Later
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={isFirstStep}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {currentStep + 1}/{onboardingSteps.length}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleSkipTour}>
                  Skip
                </Button>
                <Button onClick={handleNextStep} className="flex items-center gap-2">
                  {isLastStep ? 'Complete' : 'Next'}
                  {!isLastStep && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to check if onboarding should be shown
export function useKanbanOnboarding() {
  const [shouldShow, setShouldShow] = React.useState(false)
  const [hasSeenTour, setHasSeenTour] = React.useState(false)

  React.useEffect(() => {
    const completed = localStorage.getItem('kanban-onboarding-completed')
    const tourDate = localStorage.getItem('kanban-onboarding-date')

    setHasSeenTour(!!completed)

    // Show tour if never completed or if completed more than 30 days ago
    if (!completed) {
      setShouldShow(true)
    } else if (tourDate) {
      const daysSinceTour = Math.floor(
        (Date.now() - new Date(tourDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceTour > 30) {
        setShouldShow(true)
      }
    }
  }, [])

  const markAsCompleted = React.useCallback(() => {
    localStorage.setItem('kanban-onboarding-completed', 'true')
    localStorage.setItem('kanban-onboarding-date', new Date().toISOString())
    setHasSeenTour(true)
    setShouldShow(false)
  }, [])

  const resetTour = React.useCallback(() => {
    localStorage.removeItem('kanban-onboarding-completed')
    localStorage.removeItem('kanban-onboarding-date')
    setHasSeenTour(false)
    setShouldShow(true)
  }, [])

  return {
    shouldShow,
    hasSeenTour,
    markAsCompleted,
    resetTour,
  }
}
