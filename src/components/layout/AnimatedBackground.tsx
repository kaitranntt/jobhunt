/**
 * AnimatedBackground - Reusable animated gradient background component
 *
 * This component provides the same cool transparent gradient background
 * with floating animated orbs found on the landing page.
 *
 * @example
 * <AnimatedBackground>
 *   <YourPageContent />
 * </AnimatedBackground>
 */

interface AnimatedBackgroundProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'minimal'
}

export function AnimatedBackground({
  children,
  className = '',
  variant = 'default',
}: AnimatedBackgroundProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Multi-layer animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 gradient-page-bg" />
        <div className="absolute inset-0 gradient-accent-overlay animate-gradient" />

        {/* Animated floating orbs - only show in default variant */}
        {variant === 'default' && (
          <>
            <div className="absolute top-20 left-10 h-72 w-72 rounded-full gradient-orb-blue blur-3xl animate-float" />
            <div className="absolute top-40 right-20 h-96 w-96 rounded-full gradient-orb-pink blur-3xl animate-float-reverse" />
            <div className="absolute bottom-20 left-1/4 h-80 w-80 rounded-full gradient-orb-cyan blur-3xl animate-pulse-glow" />
          </>
        )}
      </div>

      {children}
    </div>
  )
}
