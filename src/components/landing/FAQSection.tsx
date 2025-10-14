import { ChevronRight } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

/**
 * FAQ section with collapsible details
 * Uses HTML details/summary elements for accessibility
 */
export function FAQSection() {
  const faqs = [
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
        "JobHunt is a passion project built to solve a real problem. It's community-driven and transparent. We believe great software should be accessible to everyone. Future sustainability through optional premium features for advanced users.",
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
  ]

  return (
    <AnimatedSection delay={500}>
      <section className="px-4 py-16 sm:py-24" aria-label="Frequently asked questions">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
              Frequently Asked <span className="gradient-brand-text">Questions</span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="glass group rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <summary className="cursor-pointer p-6 font-semibold text-foreground text-lg flex items-center justify-between hover:text-brand-primary">
                  {faq.question}
                  <ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-6 text-foreground/80 leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
