'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Kanban,
  TrendingUp,
  BarChart3,
  Zap,
  Users,
  Target,
  ArrowRight,
  Sparkles,
  Github,
  Star,
  GitFork,
  Code,
  Download,
  Database,
  FileCode,
  Palette,
  TestTube,
  CheckCircle2,
  ChevronRight,
  Globe,
  Lock,
  Wrench,
} from 'lucide-react'

interface StatCounterProps {
  end: number
  duration?: number
  suffix?: string
  prefix?: string
}

// Counter animation component for statistics
function StatCounter({ end, duration = 2000, suffix = '', prefix = '' }: StatCounterProps) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const startTime = Date.now()
    const endTime = startTime + duration

    const updateCount = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      const easeOutQuad = 1 - Math.pow(1 - progress, 3)
      const currentCount = Math.floor(easeOutQuad * end)

      setCount(currentCount)

      if (now < endTime) {
        requestAnimationFrame(updateCount)
      } else {
        setCount(end)
      }
    }

    requestAnimationFrame(updateCount)
  }, [isVisible, end, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

// Scroll-triggered animation wrapper
function AnimatedSection({ children, className = '', delay = 0 }: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'cloud' | 'self-hosted'>('cloud')

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Multi-layer animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950" />
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-100/30 via-transparent to-blue-100/30 dark:from-purple-900/20 dark:via-transparent dark:to-blue-900/20 animate-gradient" />

        {/* Animated floating orbs */}
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 dark:from-blue-600/20 dark:to-purple-600/20 blur-3xl animate-float" />
        <div className="absolute top-40 right-20 h-96 w-96 rounded-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 dark:from-purple-600/20 dark:to-pink-600/20 blur-3xl animate-float-reverse" />
        <div className="absolute bottom-20 left-1/4 h-80 w-80 rounded-full bg-gradient-to-r from-cyan-400/30 to-blue-400/30 dark:from-cyan-600/20 dark:to-blue-600/20 blur-3xl animate-pulse-glow" />
      </div>

      <main className="relative">
        {/* Hero Section */}
        <section className="relative px-4 py-20 sm:py-32">
          <div className="container mx-auto max-w-7xl">
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
                  <Github className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                    Open Source
                  </span>
                  <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    Star if useful ⭐
                  </span>
                </Link>
              </div>

              {/* Main heading with gradient */}
              <h1 className="mb-6 animate-slide-up opacity-0 stagger-2">
                <span className="block text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
                  <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 bg-clip-text text-transparent dark:from-white dark:via-blue-200 dark:to-purple-200 animate-gradient">
                    Open-Source Job
                  </span>
                </span>
                <span className="mt-2 block text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                    Application Tracker
                  </span>
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mx-auto mb-12 max-w-3xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl lg:text-2xl animate-slide-up opacity-0 stagger-3">
                Your data, your way. Track applications with a modern Kanban board.
                <br />
                Start free on our cloud or self-host with one command.
              </p>

              {/* Dual CTA Buttons */}
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up opacity-0 stagger-4">
                <Link
                  href="/signup"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50 dark:shadow-purple-900/50"
                  aria-label="Start tracking applications for free"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Tracking Free
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-0 animate-shimmer" />
                </Link>

                <Link
                  href="https://github.com/kaitranntt/jobhunt"
                  className="glass-strong group inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-semibold text-gray-900 shadow-lg transition-all duration-300 hover:scale-105 dark:text-white"
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
              <p className="mt-8 text-sm text-gray-600 dark:text-gray-400 animate-slide-up opacity-0 stagger-5">
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

        {/* Three-Column Value Propositions */}
        <AnimatedSection>
          <section className="px-4 py-16 sm:py-24" aria-label="Value propositions">
            <div className="container mx-auto max-w-7xl">
              <div className="grid gap-8 md:grid-cols-3">
                {/* For Job Seekers */}
                <div className="glass rounded-2xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                    <Briefcase className="h-7 w-7" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    For Job Seekers
                  </h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Simple Kanban board interface</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Mobile-ready for on-the-go tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Your data stays private</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Export anytime, no lock-in</span>
                    </li>
                  </ul>
                </div>

                {/* For Developers */}
                <div className="glass rounded-2xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <Code className="h-7 w-7" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    For Developers
                  </h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Fully customizable source code</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Full source code access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>API available for integrations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Modern tech stack (Next.js 15)</span>
                    </li>
                  </ul>
                </div>

                {/* For Teams */}
                <div className="glass rounded-2xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
                    <Users className="h-7 w-7" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">For Teams</h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Self-host for complete control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>GDPR and compliance ready</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Zero per-user licensing costs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>On-premise deployment option</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Feature Showcase with Open-Source Angle */}
        <AnimatedSection delay={100}>
          <section className="px-4 py-16 sm:py-24" aria-label="Platform features">
            <div className="container mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                  Powerful Features,{' '}
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                    Your Control
                  </span>
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                  Everything you need to manage your job search, with the freedom to customize
                </p>
              </div>

              <div className="perspective-1000 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: Kanban,
                    title: 'Customizable Kanban Board',
                    description:
                      'Drag-and-drop interface with stages that match your workflow. Add custom columns and automate transitions.',
                    gradient: 'from-purple-500 to-blue-500',
                  },
                  {
                    icon: Target,
                    title: 'Smart Application Tracking',
                    description:
                      'Add custom fields for your needs. Track salary, locations, contacts, and any data points you want.',
                    gradient: 'from-blue-500 to-cyan-500',
                  },
                  {
                    icon: Download,
                    title: 'Your Data, Your Export',
                    description:
                      'Your data belongs to you. Export to CSV, JSON anytime. No vendor lock-in, complete data portability.',
                    gradient: 'from-cyan-500 to-teal-500',
                  },
                  {
                    icon: Lock,
                    title: 'Privacy First',
                    description:
                      'Self-host for complete control. Bank-level encryption on cloud. Your job search data stays yours.',
                    gradient: 'from-teal-500 to-green-500',
                  },
                  {
                    icon: BarChart3,
                    title: 'Analytics Dashboard',
                    description:
                      'Track response rates and conversion metrics. Understand what works and optimize your strategy.',
                    gradient: 'from-green-500 to-emerald-500',
                  },
                  {
                    icon: Wrench,
                    title: 'Open Source Freedom',
                    description:
                      'Customize anything. Add features you need. Contribute improvements back to the community.',
                    gradient: 'from-purple-500 to-pink-500',
                  },
                ].map((feature, index) => (
                  <article
                    key={feature.title}
                    className="group relative"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="glass h-full rounded-2xl p-8 shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-105">
                      {/* Icon with gradient background */}
                      <div
                        className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} p-3 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}
                      >
                        <feature.icon className="h-full w-full text-white" aria-hidden="true" />
                      </div>

                      <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {feature.description}
                      </p>

                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-blue-500/0 opacity-0 transition-opacity duration-500 group-hover:from-purple-500/5 group-hover:to-blue-500/5 group-hover:opacity-100" />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Technology Stack Section */}
        <AnimatedSection delay={200}>
          <section className="px-4 py-16 sm:py-24" aria-label="Technology stack">
            <div className="container mx-auto max-w-7xl">
              <div className="text-center mb-12">
                <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                  Built with Modern,{' '}
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                    Production-Ready Tools
                  </span>
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                  Fast, secure, and scalable technology choices you can trust
                </p>
              </div>

              {/* Technology Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
                {[
                  {
                    icon: Zap,
                    name: 'Next.js 15',
                    description: 'Lightning-fast React framework',
                  },
                  {
                    icon: FileCode,
                    name: 'TypeScript',
                    description: 'Type-safe development',
                  },
                  {
                    icon: Database,
                    name: 'Supabase',
                    description: 'Open-source Firebase alternative',
                  },
                  {
                    icon: Palette,
                    name: 'Shadcn UI',
                    description: 'Beautiful accessible components',
                  },
                  {
                    icon: Sparkles,
                    name: 'Tailwind CSS',
                    description: 'Modern utility-first styling',
                  },
                  {
                    icon: TestTube,
                    name: 'Vitest',
                    description: 'Fast unit testing',
                  },
                ].map((tech, index) => (
                  <div
                    key={tech.name}
                    className="glass group rounded-xl p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <tech.icon
                          className="h-8 w-8 text-purple-600 dark:text-purple-400 transition-transform group-hover:rotate-12"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {tech.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {tech.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Developer Benefits */}
              <div className="glass-strong rounded-2xl p-8 sm:p-12">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                  Why Developers Love This Stack
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Type-Safe Throughout
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        TypeScript + Zod schemas catch errors before production
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Optimized Performance
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        React Server Components and automatic code splitting
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Modern DX
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Hot reload, ESLint, Prettier - batteries included
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Test Coverage
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vitest for fast unit and integration testing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Quick Start Dual Paths */}
        <AnimatedSection delay={300}>
          <section className="px-4 py-16 sm:py-24" aria-label="Getting started">
            <div className="container mx-auto max-w-7xl">
              <div className="text-center mb-12">
                <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                  Two Ways to{' '}
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                    Get Started
                  </span>
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                  Choose cloud hosting for instant setup or self-host for complete control
                </p>
              </div>

              {/* Tab Selection */}
              <div className="flex justify-center mb-8">
                <div className="glass-strong inline-flex rounded-xl p-1">
                  <button
                    onClick={() => setActiveTab('cloud')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                      activeTab === 'cloud'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Cloud Hosting
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('self-hosted')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                      activeTab === 'self-hosted'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Self-Hosting
                    </span>
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="glass-strong rounded-2xl p-8 sm:p-12">
                {activeTab === 'cloud' ? (
                  <div className="space-y-8">
                    <div className="text-center mb-8">
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Start Free in 3 Steps
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        No installation required. Fully managed and secure.
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white text-2xl font-bold shadow-lg">
                          1
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                          Sign Up Free
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Create your account in seconds. No credit card required.
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-2xl font-bold shadow-lg">
                          2
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                          Add Applications
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Start tracking your job applications with our intuitive interface.
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white text-2xl font-bold shadow-lg">
                          3
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                          Land Your Job
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Stay organized and never miss a follow-up opportunity.
                        </p>
                      </div>
                    </div>

                    <div className="text-center pt-6">
                      <Link
                        href="/signup"
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50"
                      >
                        Start Free Account
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center justify-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            No credit card
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            Free forever
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            Encrypted data
                          </span>
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="text-center mb-8">
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Deploy Your Own Instance
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Complete control over your data and infrastructure.
                      </p>
                    </div>

                    {/* Code snippet */}
                    <div className="glass rounded-xl p-6 overflow-x-auto">
                      <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                        <code>{`# Clone the repository
git clone https://github.com/kaitranntt/jobhunt.git
cd jobhunt

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local

# Deploy to Vercel (or any platform)
vercel deploy

# Or run locally
yarn dev`}</code>
                      </pre>
                    </div>

                    {/* Deployment options */}
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-center">
                        Deployment Options
                      </h4>
                      <div className="flex flex-wrap items-center justify-center gap-4">
                        {['Vercel', 'Docker', 'Railway', 'Render', 'AWS', 'Local Dev'].map(
                          (platform) => (
                            <div
                              key={platform}
                              className="glass rounded-lg px-4 py-2 font-semibold text-gray-900 dark:text-white text-sm"
                            >
                              {platform}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="text-center pt-6">
                      <Link
                        href="https://github.com/kaitranntt/jobhunt.git"
                        className="inline-flex items-center justify-center rounded-xl bg-gray-900 dark:bg-white px-8 py-4 text-lg font-semibold text-white dark:text-gray-900 shadow-xl transition-all duration-300 hover:scale-105"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="mr-2 h-5 w-5" />
                        View Setup Guide
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Community Section */}
        <AnimatedSection delay={400}>
          <section className="px-4 py-16 sm:py-24" aria-label="Open source community">
            <div className="container mx-auto max-w-7xl">
              <div className="glass-strong rounded-3xl p-8 sm:p-16 shadow-2xl">
                <div className="text-center mb-12">
                  <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
                    Join Our{' '}
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                      Growing Community
                    </span>
                  </h2>
                  <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                    Built transparently in the open. Contributions welcome.
                  </p>
                </div>

                {/* GitHub Stats */}
                <div className="grid gap-6 sm:grid-cols-3 mb-12">
                  <div className="glass rounded-xl p-6 text-center">
                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                      <Star className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      <StatCounter end={1200} suffix="+" />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">GitHub Stars</div>
                  </div>
                  <div className="glass rounded-xl p-6 text-center">
                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                      <GitFork className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      <StatCounter end={156} />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Forks</div>
                  </div>
                  <div className="glass rounded-xl p-6 text-center">
                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      <StatCounter end={23} />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Contributors</div>
                  </div>
                </div>

                {/* Contribution Opportunities */}
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    Ways to Contribute
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      'Report bugs and suggest features',
                      'Improve documentation',
                      'Submit pull requests',
                      'Share your use cases',
                      'Help other users',
                      'Translate to new languages',
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="https://github.com/kaitranntt/jobhunt.git"
                    className="inline-flex items-center justify-center rounded-xl bg-gray-900 dark:bg-white px-6 py-3 font-semibold text-white dark:text-gray-900 shadow-lg transition-all duration-300 hover:scale-105"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-5 w-5" />
                    Star on GitHub
                  </Link>
                  <Link
                    href="https://github.com/kaitranntt/jobhunt.git/blob/main/ROADMAP.md"
                    className="inline-flex items-center justify-center rounded-xl border-2 border-gray-300 dark:border-gray-600 px-6 py-3 font-semibold text-gray-900 dark:text-white transition-all duration-300 hover:scale-105 hover:border-purple-600 dark:hover:border-purple-400"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Roadmap
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* FAQ Section */}
        <AnimatedSection delay={500}>
          <section className="px-4 py-16 sm:py-24" aria-label="Frequently asked questions">
            <div className="container mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
                  Frequently Asked{' '}
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                    Questions
                  </span>
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  {
                    question: 'Is this really free?',
                    answer:
                      'Yes! JobHunt is MIT licensed open-source software. The cloud-hosted version is free forever with no hidden costs. You can also self-host for complete control at no licensing cost.',
                  },
                  {
                    question: 'Cloud vs self-hosted: which should I choose?',
                    answer:
                      'Cloud hosting is perfect for quick setup - sign up and start tracking immediately. Self-hosting gives you complete control over data, infrastructure, and customization. Both use the same codebase.',
                  },
                  {
                    question: 'Is my data secure?',
                    answer:
                      'Absolutely. Cloud hosting uses bank-level encryption and secure authentication via Supabase. Self-hosting gives you complete control - your data never leaves your infrastructure. All code is open for security audit.',
                  },
                  {
                    question: 'How is this sustainable?',
                    answer:
                      'JobHunt is a passion project built to solve a real problem. It\'s community-driven and transparent. We believe great software should be accessible to everyone. Future sustainability through optional premium features for advanced users.',
                  },
                  {
                    question: 'Can I contribute?',
                    answer:
                      'Yes! We welcome contributions of all kinds - code, documentation, bug reports, feature suggestions, and community support. Check our GitHub repository for contribution guidelines and good first issues.',
                  },
                  {
                    question: 'What if I need help?',
                    answer:
                      'We have comprehensive documentation, GitHub Discussions for community support, and GitHub Issues for bug reports. The community is active and helpful.',
                  },
                ].map((faq, index) => (
                  <details
                    key={index}
                    className="glass group rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
                  >
                    <summary className="cursor-pointer p-6 font-semibold text-gray-900 dark:text-white text-lg flex items-center justify-between hover:text-purple-600 dark:hover:text-purple-400">
                      {faq.question}
                      <ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-6 pb-6 text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Final CTA Section */}
        <AnimatedSection delay={600}>
          <section className="px-4 py-16 sm:py-24" aria-label="Final call to action">
            <div className="container mx-auto max-w-7xl">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-12 sm:p-16 lg:p-24 shadow-2xl">
                {/* Animated background pattern */}
                <div className="absolute inset-0 bg-gradient-to-tl from-purple-700/50 via-transparent to-blue-700/50 animate-gradient" />

                <div className="relative z-10 text-center">
                  <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                    Take Control of Your Job Search Today
                  </h2>
                  <p className="mx-auto mb-10 max-w-2xl text-xl text-purple-100">
                    Join thousands tracking applications. Your data, your way. Start free or
                    self-host in minutes.
                  </p>

                  <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link
                      href="/signup"
                      className="group inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-purple-600 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-white/50"
                      aria-label="Start tracking applications for free"
                    >
                      <span className="flex items-center gap-2">
                        Start Tracking Free
                        <TrendingUp className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>

                    <Link
                      href="https://github.com/kaitranntt/jobhunt.git"
                      className="group inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20"
                      aria-label="Self-host JobHunt from GitHub"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="flex items-center gap-2">
                        <Github className="h-5 w-5" />
                        Self-Host on GitHub
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </div>

                  {/* Trust signals */}
                  <div className="mt-12 grid gap-6 sm:grid-cols-3">
                    <div className="text-purple-100">
                      <div className="text-3xl font-bold text-white mb-1">
                        100%
                      </div>
                      <div className="text-sm">Open Source</div>
                    </div>
                    <div className="text-purple-100">
                      <div className="text-3xl font-bold text-white mb-1">
                        MIT
                      </div>
                      <div className="text-sm">License</div>
                    </div>
                    <div className="text-purple-100">
                      <div className="text-3xl font-bold text-white mb-1">
                        Free
                      </div>
                      <div className="text-sm">Forever</div>
                    </div>
                  </div>

                  <p className="mt-8 text-sm text-purple-200">
                    Open Source • MIT License • Active Development
                  </p>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Footer */}
        <footer className="px-4 py-12 border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} JobHunt. Open source under MIT License.
              </p>
              <div className="flex items-center gap-6">
                <Link
                  href="https://github.com/kaitranntt/jobhunt.git"
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub repository"
                >
                  <Github className="h-5 w-5" />
                </Link>
                <Link
                  href="https://github.com/kaitranntt/jobhunt.git/blob/main/LICENSE"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MIT License
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
