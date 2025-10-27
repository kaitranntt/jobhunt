'use client'

import Link from 'next/link'
import { ArrowRight, Github, Star, CheckCircle2, ChevronRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative px-4 py-16 sm:py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center">
          {/* Open Source Badge */}
          <div className="mb-8 flex justify-center animate-slide-up opacity-0 stagger-1">
            <Link
              href="https://github.com/kaitranntt/jobhunt.git"
              className="glass-strong group inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-medium shadow-lg transition-all duration-300 hover:scale-105"
              aria-label="View JobHunt on GitHub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-6 w-6 text-brand-primary" />
              <span className="gradient-brand-text">Open Source</span>
              <span className="flex items-center gap-1 text-foreground/90">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                Star if useful ⭐
              </span>
            </Link>
          </div>

          {/* Main heading with gradient */}
          <h1 className="mb-6 animate-slide-up opacity-0 stagger-2">
            <span className="block text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="gradient-brand-text animate-gradient">Open-Source</span>
            </span>
            <span className="mt-2 block text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="gradient-brand-text">Job Application Tracker</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-12 max-w-4xl text-lg text-foreground/90 sm:text-xl lg:text-2xl animate-slide-up opacity-0 stagger-3">
            Your data, your way. Track applications with a modern Kanban board.
            <br />
            Start free on our cloud or self-host with one command.
          </p>

          {/* Dual CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up opacity-0 stagger-4">
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl btn-brand-gradient px-8 py-4 text-lg font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-orange-500/50 dark:shadow-orange-900/50"
              aria-label="Start tracking applications for free"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Tracking Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 btn-brand-gradient-hover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-0 animate-shimmer" />
            </Link>

            <Link
              href="https://github.com/kaitranntt/jobhunt"
              className="glass-strong group inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-semibold text-foreground shadow-lg transition-all duration-300 hover:scale-105"
              aria-label="Self-host JobHunt from GitHub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Self-Host on GitHub
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-foreground/80 animate-slide-up opacity-0 stagger-5">
            <span className="flex items-center justify-center gap-6 flex-wrap">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                No credit card
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                Encrypted data
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                MIT License
              </span>
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
