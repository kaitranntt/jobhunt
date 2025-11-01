/**
 * Real-time Chart Component
 *
 * Interactive chart component for displaying real-time metrics
 * with auto-refresh, zoom, and pan capabilities.
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Play, Pause, RotateCcw, Download, ZoomIn, ZoomOut } from 'lucide-react'

export interface DataPoint {
  timestamp: number
  value: number
  label?: string
}

export interface ChartSeries {
  id: string
  name: string
  data: DataPoint[]
  color: string
  unit?: string
  type?: 'line' | 'area' | 'bar'
}

export interface RealTimeChartProps {
  title: string
  series: ChartSeries[]
  timeRange?: number // minutes
  refreshInterval?: number // milliseconds
  _maxDataPoints?: number
  height?: number
  showControls?: boolean
  showLegend?: boolean
  autoRefresh?: boolean
  onDataPoint?: (data: DataPoint) => void
  onExport?: (series: ChartSeries[]) => void
  className?: string
}

export function RealTimeChart({
  title,
  series,
  timeRange = 60,
  refreshInterval = 5000,
  _maxDataPoints = 100,
  height = 300,
  showControls = true,
  showLegend = true,
  autoRefresh = true,
  onDataPoint,
  onExport,
  className = '',
}: RealTimeChartProps) {
  const [isPlaying, setIsPlaying] = useState(autoRefresh)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [_isPanning, _setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState(0)
  const [hoveredPoint, setHoveredPoint] = useState<{
    series: ChartSeries
    point: DataPoint
  } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const lastUpdateRef = useRef(Date.now())

  // Update chart data
  const updateChart = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Set up drawing context
    ctx.lineWidth = 2
    ctx.font = '12px sans-serif'

    // Calculate time range
    const now = Date.now()
    const timeWindow = selectedTimeRange * 60 * 1000
    const startTime = now - timeWindow

    // Draw grid
    drawGrid(ctx, width, height, startTime, now)

    // Draw series
    series.forEach(seriesItem => {
      drawSeries(ctx, seriesItem, width, height, startTime, now, zoomLevel, panOffset)
    })

    // Draw axes
    drawAxes(ctx, width, height, startTime, now)

    // Draw legend
    if (showLegend) {
      drawLegend(ctx, series, width)
    }

    // Draw hover tooltip
    if (hoveredPoint && containerRef.current) {
      drawTooltip(ctx, hoveredPoint, width, height)
    }

    lastUpdateRef.current = Date.now()
  }, [series, selectedTimeRange, zoomLevel, panOffset, hoveredPoint, showLegend])

  // Animation loop
  const animate = useCallback(() => {
    updateChart()
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [isPlaying, updateChart])

  // Start/stop animation
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, animate])

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        canvasRef.current.width = rect.width
        canvasRef.current.height = height
        updateChart()
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [height, updateChart])

  // Auto-refresh data
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      // This would be replaced with actual data fetching
      if (onDataPoint) {
        series.forEach(seriesItem => {
          const latestData = seriesItem.data[seriesItem.data.length - 1]
          if (latestData) {
            // Simulate new data point
            const newPoint: DataPoint = {
              timestamp: Date.now(),
              value: latestData.value + (Math.random() - 0.5) * 10,
            }
            onDataPoint(newPoint)
          }
        })
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [isPlaying, refreshInterval, series, onDataPoint])

  // Drawing functions
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startTime: number,
    endTime: number
  ) => {
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1

    // Vertical grid lines (time)
    const _timeStep = (endTime - startTime) / 10
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height - 30)
      ctx.stroke()
    }

    // Horizontal grid lines (value)
    for (let i = 0; i <= 5; i++) {
      const y = (i / 5) * (height - 30)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  const drawSeries = (
    ctx: CanvasRenderingContext2D,
    series: ChartSeries,
    width: number,
    height: number,
    startTime: number,
    endTime: number,
    zoomLevel: number,
    panOffset: number
  ) => {
    if (series.data.length === 0) return

    ctx.strokeStyle = series.color
    ctx.fillStyle = series.color + '20' // Add transparency for area

    const timeWindow = (endTime - startTime) / zoomLevel
    const adjustedStartTime = startTime + panOffset
    const adjustedEndTime = adjustedStartTime + timeWindow

    // Filter data points within visible range
    const visibleData = series.data.filter(
      point => point.timestamp >= adjustedStartTime && point.timestamp <= adjustedEndTime
    )

    if (visibleData.length === 0) return

    // Calculate value range
    const minValue = Math.min(...visibleData.map(p => p.value))
    const maxValue = Math.max(...visibleData.map(p => p.value))
    const valueRange = maxValue - minValue || 1

    const chartHeight = height - 50
    const chartWidth = width

    // Draw line or area
    ctx.beginPath()
    visibleData.forEach((point, index) => {
      const x = ((point.timestamp - adjustedStartTime) / timeWindow) * chartWidth
      const y = chartHeight - ((point.value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    if (series.type === 'area') {
      // Complete the area
      const lastPoint = visibleData[visibleData.length - 1]
      const lastX = ((lastPoint.timestamp - adjustedStartTime) / timeWindow) * chartWidth

      ctx.lineTo(lastX, chartHeight)
      ctx.lineTo(0, chartHeight)
      ctx.closePath()
      ctx.fill()
    }

    ctx.stroke()

    // Draw data points
    ctx.fillStyle = series.color
    visibleData.forEach(point => {
      const x = ((point.timestamp - adjustedStartTime) / timeWindow) * chartWidth
      const y = chartHeight - ((point.value - minValue) / valueRange) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const drawAxes = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startTime: number,
    endTime: number
  ) => {
    ctx.strokeStyle = '#374151'
    ctx.fillStyle = '#374151'
    ctx.lineWidth = 2

    // X-axis
    ctx.beginPath()
    ctx.moveTo(0, height - 30)
    ctx.lineTo(width, height - 30)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, height - 30)
    ctx.stroke()

    // Time labels
    ctx.font = '10px sans-serif'
    const _timeStep2 = (endTime - startTime) / 5
    for (let i = 0; i <= 5; i++) {
      const time = startTime + i * _timeStep2
      const x = (i / 5) * width
      const label = new Date(time).toLocaleTimeString().slice(0, 5)

      ctx.fillText(label, x - 15, height - 10)
    }
  }

  const drawLegend = (ctx: CanvasRenderingContext2D, series: ChartSeries[], width: number) => {
    const legendX = width - 150
    const legendY = 10

    series.forEach((seriesItem, index) => {
      const y = legendY + index * 20

      // Color box
      ctx.fillStyle = seriesItem.color
      ctx.fillRect(legendX, y, 10, 10)

      // Label
      ctx.fillStyle = '#374151'
      ctx.font = '12px sans-serif'
      ctx.fillText(seriesItem.name, legendX + 15, y + 8)
    })
  }

  const drawTooltip = (
    ctx: CanvasRenderingContext2D,
    hoveredPoint: { series: ChartSeries; point: DataPoint },
    width: number,
    _height: number
  ) => {
    const tooltipWidth = 150
    const tooltipHeight = 60
    const tooltipX = Math.min(width - tooltipWidth - 10, 100)
    const tooltipY = 10

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight)

    // Border
    ctx.strokeStyle = hoveredPoint.series.color
    ctx.lineWidth = 2
    ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight)

    // Text
    ctx.fillStyle = 'white'
    ctx.font = '12px sans-serif'
    ctx.fillText(hoveredPoint.series.name, tooltipX + 10, tooltipY + 20)
    ctx.fillText(`Value: ${hoveredPoint.point.value.toFixed(2)}`, tooltipX + 10, tooltipY + 35)
    ctx.fillText(
      new Date(hoveredPoint.point.timestamp).toLocaleTimeString(),
      tooltipX + 10,
      tooltipY + 50
    )
  }

  // Handle mouse interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const _y = e.clientY - rect.top

    // Find nearest data point
    // This is a simplified version - in practice you'd want more sophisticated hit detection
    const timeWindow = selectedTimeRange * 60 * 1000
    const now = Date.now()
    const startTime = now - timeWindow
    const clickTime = startTime + (x / rect.width) * timeWindow

    let nearestPoint: { series: ChartSeries; point: DataPoint } | null = null
    let minDistance = Infinity

    series.forEach(seriesItem => {
      seriesItem.data.forEach(point => {
        const distance = Math.abs(point.timestamp - clickTime)
        if (distance < minDistance) {
          minDistance = distance
          nearestPoint = { series: seriesItem, point }
        }
      })
    })

    setHoveredPoint(minDistance < timeWindow / 50 ? nearestPoint : null)
  }

  const handleExport = () => {
    if (onExport) {
      onExport(series)
    }
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 10))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5))
  }

  const handleReset = () => {
    setZoomLevel(1)
    setPanOffset(0)
    setSelectedTimeRange(timeRange)
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>

        {showControls && (
          <div className="flex items-center space-x-2">
            <Select
              value={selectedTimeRange.toString()}
              onValueChange={value => setSelectedTimeRange(parseInt(value))}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5m</SelectItem>
                <SelectItem value="15">15m</SelectItem>
                <SelectItem value="30">30m</SelectItem>
                <SelectItem value="60">1h</SelectItem>
                <SelectItem value="240">4h</SelectItem>
                <SelectItem value="1440">24h</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>

            <Button variant="outline" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
              <ZoomIn className="h-3 w-3" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
              <ZoomOut className="h-3 w-3" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleReset} className="h-8 w-8 p-0">
              <RotateCcw className="h-3 w-3" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 w-8 p-0">
              <Download className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div ref={containerRef} className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={height}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
            className="w-full cursor-crosshair"
          />

          {hoveredPoint && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-xs">
                {hoveredPoint.series.name}: {hoveredPoint.point.value.toFixed(2)}
                {hoveredPoint.series.unit}
              </Badge>
            </div>
          )}

          {zoomLevel !== 1 && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="outline" className="text-xs">
                Zoom: {(zoomLevel * 100).toFixed(0)}%
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
