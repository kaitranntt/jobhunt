import { Briefcase, Code, Users, CheckCircle2 } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

/**
 * Three-column value propositions section
 * Highlights benefits for job seekers, developers, and teams
 */
export function ValuePropositionsSection() {
  return (
    <AnimatedSection>
      <section className="px-4 py-16 sm:py-24" aria-label="Value propositions">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            {/* For Job Seekers */}
            <div className="glass rounded-2xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-brand text-white">
                <Briefcase className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">
                For Job Seekers
              </h3>
              <ul className="space-y-3 text-foreground/80">
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
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-brand text-white">
                <Code className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">
                For Developers
              </h3>
              <ul className="space-y-3 text-foreground/80">
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
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-brand text-white">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">For Teams</h3>
              <ul className="space-y-3 text-foreground/80">
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
  )
}
