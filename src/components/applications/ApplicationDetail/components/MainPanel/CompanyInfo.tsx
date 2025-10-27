'use client'

import * as React from 'react'
import { Building2, Globe, Users, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface CompanyInfoProps {
  application: Application
  className?: string
}

export function CompanyInfo({ application, className }: CompanyInfoProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Coming Soon Banner */}
      <div className="glass-light bg-copper/10 border border-copper/30 rounded-glass-sm p-6 text-center">
        <Building2 className="w-12 h-12 text-copper mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-label-primary mb-2">Company Information</h3>
        <p className="text-label-secondary">
          Detailed company information and research features coming soon. This will include company
          data, employee insights, and research tools.
        </p>
      </div>

      {/* Basic Company Info */}
      <section className="glass-ultra rounded-glass-sm p-6">
        <h3 className="text-lg font-semibold text-label-primary mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-copper" />
          Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-label-secondary mb-1">Company Name</h4>
            <p className="text-label-primary font-medium">{application.company_name}</p>
          </div>
        </div>
      </section>

      {/* Feature Preview */}
      <section className="glass-ultra rounded-glass-sm p-6 opacity-60">
        <h3 className="text-lg font-semibold text-label-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-copper" />
          Coming Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-label-tertiary" />
            <span className="text-sm text-label-secondary">Company website & social media</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-label-tertiary" />
            <span className="text-sm text-label-secondary">Employee count & insights</span>
          </div>
        </div>
      </section>
    </div>
  )
}
