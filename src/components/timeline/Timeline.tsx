'use client'

import { useState, useEffect, useCallback } from 'react'
import { Filter, ArrowUpDown } from 'lucide-react'
import { getTimelineActivities } from '@/lib/api/timeline'
import type { TimelineActivity, TimelineFilters, TimelineSortOrder, TimelineActivityType } from '@/lib/types/timeline.types'
import TimelineItem from './TimelineItem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'

interface TimelineProps {
  userId: string
}

interface GroupedActivities {
  [key: string]: TimelineActivity[]
}

function getDateGroup(date: Date): string {
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays <= 7) return 'This Week'
  if (diffDays <= 30) return 'This Month'
  return 'Older'
}

function groupActivitiesByDate(activities: TimelineActivity[]): GroupedActivities {
  return activities.reduce<GroupedActivities>((groups, activity) => {
    const date = new Date(activity.created_at)
    const group = getDateGroup(date)

    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(activity)

    return groups
  }, {})
}

const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older']

export default function Timeline({ userId }: TimelineProps) {
  const [activities, setActivities] = useState<TimelineActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedTypes, setSelectedTypes] = useState<TimelineActivityType[]>([])
  const [sortOrder, setSortOrder] = useState<TimelineSortOrder>('newest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: TimelineFilters = {}

      if (selectedTypes.length > 0 && selectedTypes.length < 4) {
        filters.types = selectedTypes
      }

      if (dateFrom) {
        filters.dateFrom = new Date(dateFrom).toISOString()
      }

      if (dateTo) {
        filters.dateTo = new Date(dateTo).toISOString()
      }

      const data = await getTimelineActivities(userId, filters, sortOrder)
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline activities')
    } finally {
      setLoading(false)
    }
  }, [userId, selectedTypes, dateFrom, dateTo, sortOrder])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchActivities()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [fetchActivities])

  const toggleType = (type: TimelineActivityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const groupedActivities = groupActivitiesByDate(activities)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading timeline...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load timeline: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No activities found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Timeline</CardTitle>
          <div className="flex gap-2">
            {/* Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Filter activities">
                  <Filter className="mr-2 size-4" />
                  Filter
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Activities</SheetTitle>
                  <SheetDescription>Filter timeline activities by type and date range</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Activity Type Filters */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Activity Types</Label>
                    <div className="space-y-2">
                      {(['application', 'contact', 'document', 'reminder'] as const).map((type) => (
                        <div key={type} className="flex items-center gap-2">
                          <Checkbox
                            id={`filter-${type}`}
                            checked={selectedTypes.includes(type)}
                            onCheckedChange={() => toggleType(type)}
                            aria-label={`${type.charAt(0).toUpperCase() + type.slice(1)}`}
                          />
                          <label
                            htmlFor={`filter-${type}`}
                            className="text-sm capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date Range Filters */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Date Range</Label>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                          From
                        </Label>
                        <Input
                          id="date-from"
                          type="text"
                          placeholder="YYYY-MM-DD"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                          To
                        </Label>
                        <Input
                          id="date-to"
                          type="text"
                          placeholder="YYYY-MM-DD"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Sort activities">
                  <ArrowUpDown className="mr-2 size-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOrder('newest')}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder('oldest')}>
                  Oldest First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {groupOrder.map((group) => {
            const groupActivities = groupedActivities[group]
            if (!groupActivities || groupActivities.length === 0) return null

            return (
              <div key={group}>
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{group}</h3>
                <ul className="space-y-4">
                  {groupActivities.map((activity) => (
                    <TimelineItem key={activity.id} activity={activity} />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
