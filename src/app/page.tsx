'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Kanban,
  Shield,
  TrendingUp,
  Clock,
  BarChart3,
  Zap,
  Users,
  Target,
  ArrowRight,
  Sparkles,
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
              {/* Floating badge */}
              <div className="mb-8 flex justify-center animate-slide-up opacity-0 stagger-1">
                <div className="glass-strong inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg">
                  <Sparkles className="h-4 w-4 text-purple-500" aria-hidden="true" />
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                    Transform Your Job Search
                  </span>
                </div>
              </div>

              {/* Main heading with gradient */}
              <h1 className="mb-6 animate-slide-up opacity-0 stagger-2">
                <span className="block text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
                  <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 bg-clip-text text-transparent dark:from-white dark:via-blue-200 dark:to-purple-200 animate-gradient">
                    Your Dream Job
                  </span>
                </span>
                <span className="mt-2 block text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                    Starts Here
                  </span>
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mx-auto mb-12 max-w-3xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl lg:text-2xl animate-slide-up opacity-0 stagger-3">
                Track applications, visualize progress, and land your dream role with our
                intelligent job search platform powered by modern technology
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up opacity-0 stagger-4">
                <Link
                  href="/signup"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50 dark:shadow-purple-900/50"
                  aria-label="Get started with JobHunt for free"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-0 animate-shimmer" />
                </Link>

                <Link
                  href="/login"
                  className="glass-strong group inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-semibold text-gray-900 shadow-lg transition-all duration-300 hover:scale-105 dark:text-white"
                  aria-label="Sign in to your JobHunt account"
                >
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <AnimatedSection>
          <section className="px-4 py-16 sm:py-24" aria-label="Platform statistics">
            <div className="container mx-auto max-w-7xl">
              <div className="glass-strong rounded-3xl p-8 shadow-2xl sm:p-12">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center">
                    <div className="mb-2 text-4xl font-bold text-purple-600 dark:text-purple-400 sm:text-5xl">
                      <StatCounter end={10000} suffix="+" />
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 sm:text-base">
                      Active Users
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 text-4xl font-bold text-blue-600 dark:text-blue-400 sm:text-5xl">
                      <StatCounter end={50000} suffix="+" />
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 sm:text-base">
                      Applications Tracked
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 text-4xl font-bold text-green-600 dark:text-green-400 sm:text-5xl">
                      <StatCounter end={85} suffix="%" />
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 sm:text-base">
                      Success Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 text-4xl font-bold text-orange-600 dark:text-orange-400 sm:text-5xl">
                      <StatCounter end={24} suffix="h" />
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 sm:text-base">
                      Average Response Time
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Features Grid with 3D Cards */}
        <AnimatedSection delay={100}>
          <section className="px-4 py-16 sm:py-24" aria-label="Platform features">
            <div className="container mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                  Everything You Need to{' '}
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                    Succeed
                  </span>
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                  Powerful features designed to streamline your job search and maximize your
                  success rate
                </p>
              </div>

              <div className="perspective-1000 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: Briefcase,
                    title: 'Smart Application Tracking',
                    description:
                      'Organize every application with intelligent categorization, deadline reminders, and follow-up automation',
                    gradient: 'from-purple-500 to-blue-500',
                  },
                  {
                    icon: Kanban,
                    title: 'Visual Kanban Board',
                    description:
                      'Drag-and-drop interface to visualize your pipeline from application to offer with real-time updates',
                    gradient: 'from-blue-500 to-cyan-500',
                  },
                  {
                    icon: BarChart3,
                    title: 'Advanced Analytics',
                    description:
                      'Track response rates, interview conversion, and optimize your strategy with data-driven insights',
                    gradient: 'from-cyan-500 to-teal-500',
                  },
                  {
                    icon: Clock,
                    title: 'Timeline Management',
                    description:
                      'Never miss a deadline with smart notifications, calendar integration, and automated reminders',
                    gradient: 'from-teal-500 to-green-500',
                  },
                  {
                    icon: Target,
                    title: 'Goal Setting & Progress',
                    description:
                      'Set daily, weekly, and monthly goals. Track progress with visual indicators and motivational insights',
                    gradient: 'from-green-500 to-emerald-500',
                  },
                  {
                    icon: Shield,
                    title: 'Enterprise Security',
                    description:
                      'Bank-level encryption, secure authentication, and complete data privacy with SOC 2 compliance',
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

        {/* Technology Stack Showcase */}
        <AnimatedSection delay={200}>
          <section className="px-4 py-16 sm:py-24" aria-label="Technology stack">
            <div className="container mx-auto max-w-7xl">
              <div className="text-center mb-12">
                <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                  Built with{' '}
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                    Modern Tech
                  </span>
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                  Leveraging cutting-edge technologies for speed, security, and scalability
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                {[
                  'Next.js 15',
                  'React 18',
                  'TypeScript',
                  'Tailwind CSS',
                  'Supabase',
                  'PostgreSQL',
                  'Vercel',
                  'Shadcn UI',
                ].map((tech, index) => (
                  <div
                    key={tech}
                    className="glass-strong group rounded-xl px-6 py-3 font-semibold text-gray-900 dark:text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="flex items-center gap-2">
                      <Zap
                        className="h-4 w-4 text-yellow-500 transition-transform group-hover:rotate-12"
                        aria-hidden="true"
                      />
                      {tech}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Social Proof Section */}
        <AnimatedSection delay={300}>
          <section className="px-4 py-16 sm:py-24" aria-label="User testimonials">
            <div className="container mx-auto max-w-7xl">
              <div className="glass-strong rounded-3xl p-8 sm:p-16 shadow-2xl">
                <div className="grid gap-12 lg:grid-cols-2 items-center">
                  <div>
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/30 px-4 py-2">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                        Trusted by Thousands
                      </span>
                    </div>
                    <h2 className="mb-6 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
                      Join the Job Hunters Who Are{' '}
                      <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent dark:from-green-400 dark:to-blue-400">
                        Winning
                      </span>
                    </h2>
                    <p className="mb-8 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                      Thousands of professionals have transformed their job search with JobHunt.
                      Our platform has helped users secure positions at top companies worldwide,
                      reducing average job search time by 40% and increasing interview rates by 3x.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="h-12 w-12 rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-br from-purple-400 to-blue-400"
                          />
                        ))}
                      </div>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          10,000+ Active Users
                        </div>
                        <div className="text-gray-600 dark:text-gray-300">
                          Average 4.9/5 rating
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {[
                      {
                        text: 'JobHunt transformed my job search. I went from scattered spreadsheets to a streamlined process. Landed my dream role in 6 weeks!',
                        name: 'Sarah Chen',
                        role: 'Senior Developer',
                      },
                      {
                        text: "The kanban board visualization changed everything. I could see my pipeline clearly and prioritize follow-ups. It's like having a personal job search assistant.",
                        name: 'Marcus Rodriguez',
                        role: 'Product Manager',
                      },
                    ].map((testimonial, index) => (
                      <blockquote
                        key={index}
                        className="glass rounded-2xl p-6 shadow-lg transition-all duration-300 hover:scale-105"
                      >
                        <p className="mb-4 text-gray-700 dark:text-gray-200 italic leading-relaxed">
                          &ldquo;{testimonial.text}&rdquo;
                        </p>
                        <footer className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400" />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {testimonial.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {testimonial.role}
                            </div>
                          </div>
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Final CTA Section */}
        <AnimatedSection delay={400}>
          <section className="px-4 py-16 sm:py-24" aria-label="Call to action">
            <div className="container mx-auto max-w-7xl">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-12 sm:p-16 lg:p-24 shadow-2xl">
                {/* Animated background pattern */}
                <div className="absolute inset-0 bg-gradient-to-tl from-purple-700/50 via-transparent to-blue-700/50 animate-gradient" />

                <div className="relative z-10 text-center">
                  <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                    Ready to Land Your Dream Job?
                  </h2>
                  <p className="mx-auto mb-10 max-w-2xl text-xl text-purple-100">
                    Join thousands of professionals who have transformed their job search. Start
                    tracking, visualizing, and succeeding today.
                  </p>

                  <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link
                      href="/signup"
                      className="group inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-purple-600 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-white/50"
                      aria-label="Start your free trial"
                    >
                      <span className="flex items-center gap-2">
                        Start Free Trial
                        <TrendingUp className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>

                    <Link
                      href="/login"
                      className="group inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20"
                      aria-label="View live demo"
                    >
                      <span className="flex items-center gap-2">
                        View Demo
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </div>

                  <p className="mt-8 text-sm text-purple-200">
                    No credit card required • Free forever plan • Cancel anytime
                  </p>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Footer */}
        <footer className="px-4 py-12 border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto max-w-7xl text-center">
            <p className="text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} JobHunt. Built with React, Next.js, and
              TypeScript.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
