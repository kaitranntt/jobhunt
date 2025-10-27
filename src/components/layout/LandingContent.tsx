'use client'

import Link from 'next/link'
import { Github } from 'lucide-react'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { NavBar } from '@/components/layout/NavBar'
import { HeroSection } from '@/components/landing/HeroSection'
import { ValuePropositionsSection } from '@/components/landing/ValuePropositionsSection'
import { PlatformFeaturesSection } from '@/components/landing/PlatformFeaturesSection'
import { TechnologyStackSection } from '@/components/landing/TechnologyStackSection'
import { GetStartedSection } from '@/components/landing/GetStartedSection'
import { OpenSourceCommunitySection } from '@/components/landing/OpenSourceCommunitySection'
import { FAQSection } from '@/components/landing/FAQSection'
import { FinalCTASection } from '@/components/landing/FinalCTASection'
import type { User } from '@supabase/supabase-js'

interface LandingContentProps {
  user: User | null
}

/**
 * Main landing page content component
 * Orchestrates all landing page sections with animated background
 */
export function LandingContent({ user }: LandingContentProps) {
  return (
    <AnimatedBackground>
      <NavBar variant="landing" user={user} />
      <main className="relative pt-20">
        <HeroSection />
        <ValuePropositionsSection />
        <PlatformFeaturesSection />
        <TechnologyStackSection />
        <GetStartedSection />
        <OpenSourceCommunitySection />
        <FAQSection />
        <FinalCTASection />

        {/* Footer */}
        <footer className="px-3 py-8 border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-foreground/80 text-sm">
                &copy; {new Date().getFullYear()} JobHunt. Open source under MIT License.
              </p>
              <div className="flex items-center gap-6">
                <Link
                  href="https://github.com/kaitranntt/jobhunt.git"
                  className="text-foreground/80 hover:text-brand-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub repository"
                >
                  <Github className="h-5 w-5" />
                </Link>
                <Link
                  href="https://github.com/kaitranntt/jobhunt.git/blob/main/LICENSE"
                  className="text-sm text-foreground/80 hover:text-brand-primary transition-colors"
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
    </AnimatedBackground>
  )
}
