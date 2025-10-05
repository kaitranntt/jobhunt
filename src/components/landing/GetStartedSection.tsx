'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Github, Code, CheckCircle2, Globe } from 'lucide-react'

export function GetStartedSection() {
  const [activeTab, setActiveTab] = useState<'cloud' | 'self-hosted'>('cloud')

  return (
    <section className="px-4 py-16 sm:py-24" aria-label="Getting started">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Two Ways to{' '}
            <span className="gradient-brand-text">Get Started</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-foreground/90">
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
                  ? 'btn-brand-gradient text-white shadow-lg'
                  : 'text-foreground/90 hover:text-foreground'
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
                  ? 'btn-brand-gradient text-white shadow-lg'
                  : 'text-foreground/90 hover:text-foreground'
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
                <h3 className="text-3xl font-bold text-foreground mb-2">
                  Start Free in 3 Steps
                </h3>
                <p className="text-foreground/90">
                  No installation required. Fully managed and secure.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full gradient-brand text-white text-2xl font-bold shadow-lg">
                    1
                  </div>
                  <h4 className="font-bold text-foreground mb-2">Sign Up Free</h4>
                  <p className="text-sm text-foreground/80">
                    Create your account in seconds. No credit card required.
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full gradient-brand text-white text-2xl font-bold shadow-lg">
                    2
                  </div>
                  <h4 className="font-bold text-foreground mb-2">Add Applications</h4>
                  <p className="text-sm text-foreground/80">
                    Start tracking your job applications with our intuitive interface.
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full gradient-brand text-white text-2xl font-bold shadow-lg">
                    3
                  </div>
                  <h4 className="font-bold text-foreground mb-2">Land Your Job</h4>
                  <p className="text-sm text-foreground/80">
                    Stay organized and never miss a follow-up opportunity.
                  </p>
                </div>
              </div>

              <div className="text-center pt-6">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-xl btn-brand-gradient px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50"
                >
                  Start Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <p className="mt-4 text-sm text-foreground/80">
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
                <h3 className="text-3xl font-bold text-foreground mb-2">
                  Deploy Your Own Instance
                </h3>
                <p className="text-foreground/90">
                  Complete control over your data and infrastructure.
                </p>
              </div>

              {/* Code snippet */}
              <div className="glass rounded-xl p-6 overflow-x-auto">
                <pre className="text-sm text-foreground/90 font-mono">
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
                <h4 className="font-bold text-foreground mb-4 text-center">
                  Deployment Options
                </h4>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {['Vercel', 'Docker', 'Railway', 'Render', 'AWS', 'Local Dev'].map(
                    (platform) => (
                      <div
                        key={platform}
                        className="glass rounded-lg px-4 py-2 font-semibold text-foreground text-sm"
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
  )
}
