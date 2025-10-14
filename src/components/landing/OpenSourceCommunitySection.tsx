import Link from 'next/link'
import {
  Github,
  ArrowRight,
  Rocket,
  Target,
  Sparkles,
  TrendingUp,
  Code,
  Users,
  TestTube,
} from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

/**
 * Open source community section
 * Highlights early stage status and contribution opportunities
 */
export function OpenSourceCommunitySection() {
  const contributionOpportunities = [
    { icon: Target, text: 'Help define core features' },
    { icon: Sparkles, text: 'Report bugs and suggest improvements' },
    { icon: TrendingUp, text: 'Shape the roadmap' },
    { icon: Code, text: 'Contribute code or documentation' },
    { icon: Users, text: 'Share your use cases' },
    { icon: TestTube, text: 'Test and provide feedback' },
  ]

  return (
    <AnimatedSection delay={400}>
      <section className="px-4 py-16 sm:py-24" aria-label="Open source community">
        <div className="container mx-auto max-w-7xl">
          <div className="glass-strong rounded-3xl p-8 sm:p-16 shadow-2xl">
            <div className="text-center mb-12">
              <h2 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
                <span className="gradient-brand-text">Open Source</span> & Early Stage
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-foreground/90">
                This project is just getting started. Your feedback and contributions can shape its
                future.
              </p>
            </div>

            {/* Project Status Badge */}
            <div className="mb-10 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-6 py-3 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Rocket className="h-5 w-5" />
                <span className="font-semibold">Active Development • MIT Licensed</span>
              </div>
            </div>

            {/* Early Adopter Benefits */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-foreground mb-8 text-center">
                How You Can Contribute
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {contributionOpportunities.map(item => (
                  <div
                    key={item.text}
                    className="flex flex-col items-center text-center gap-3 p-4 rounded-xl glass hover:glass-strong transition-all duration-300"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm text-foreground/90">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="https://github.com/kaitranntt/jobhunt"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 dark:bg-white px-6 py-3 font-semibold text-white dark:text-gray-900 shadow-lg transition-all duration-300 hover:scale-105"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </Link>
              <Link
                href="https://github.com/kaitranntt/jobhunt/issues/new"
                className="inline-flex items-center justify-center rounded-xl border-2 border-gray-300 dark:border-gray-600 px-6 py-3 font-semibold text-foreground transition-all duration-300 hover:scale-105 hover:border-purple-600 dark:hover:border-purple-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                Share Feedback
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
