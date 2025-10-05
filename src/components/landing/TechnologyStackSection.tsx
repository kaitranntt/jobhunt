import { Zap, FileCode, Database, Palette, Sparkles, TestTube, CheckCircle2 } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

/**
 * Technology stack showcase section
 * Displays tech stack with benefits and developer advantages
 */
export function TechnologyStackSection() {
  const technologies = [
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
  ]

  const developerBenefits = [
    {
      title: 'Type-Safe Throughout',
      description: 'TypeScript + Zod schemas catch errors before production',
    },
    {
      title: 'Optimized Performance',
      description: 'React Server Components and automatic code splitting',
    },
    {
      title: 'Modern DX',
      description: 'Hot reload, ESLint, Prettier - batteries included',
    },
    {
      title: 'Test Coverage',
      description: 'Vitest for fast unit and integration testing',
    },
  ]

  return (
    <AnimatedSection delay={200}>
      <section className="px-4 py-16 sm:py-24" aria-label="Technology stack">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Built with Modern,{' '}
              <span className="gradient-brand-text">
                Production-Ready Tools
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-foreground/90">
              Fast, secure, and scalable technology choices you can trust
            </p>
          </div>

          {/* Technology Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            {technologies.map((tech, index) => (
              <div
                key={tech.name}
                className="glass group rounded-xl p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <tech.icon
                      className="h-8 w-8 text-brand-primary transition-transform group-hover:rotate-12"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {tech.name}
                    </h3>
                    <p className="text-sm text-foreground/80">
                      {tech.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Developer Benefits */}
          <div className="glass-strong rounded-2xl p-8 sm:p-12">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              Why Developers Love This Stack
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {developerBenefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-foreground/80">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
