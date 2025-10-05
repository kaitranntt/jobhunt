import { Kanban, Target, Download, Lock, BarChart3, Wrench } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

/**
 * Platform features showcase section with 6 feature cards
 * Each card has an icon, title, description, and gradient background
 */
export function PlatformFeaturesSection() {
  const features = [
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
  ]

  return (
    <AnimatedSection delay={100}>
      <section className="px-4 py-16 sm:py-24" aria-label="Platform features">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Powerful Features,{' '}
              <span className="gradient-brand-text">
                Your Control
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-foreground/90">
              Everything you need to manage your job search, with the freedom to customize
            </p>
          </div>

          <div className="perspective-1000 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
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

                  <h3 className="mb-4 text-2xl font-bold text-foreground">
                    {feature.title}
                  </h3>

                  <p className="text-foreground/80 leading-relaxed">
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
  )
}
