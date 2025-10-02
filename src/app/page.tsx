import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
      <main className="container mx-auto px-4 text-center">
        <h1 className="mb-6 text-5xl font-bold text-foreground">JobHunt</h1>
        <p className="mb-8 text-xl text-muted-foreground">Track your job applications efficiently</p>
        <p className="mb-12 text-muted-foreground">
          Organize applications, track interview progress, and land your dream job
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-border bg-card px-6 py-3 text-card-foreground hover:bg-accent"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg bg-card p-6 shadow border border-border">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Track Applications</h3>
            <p className="text-sm text-muted-foreground">
              Keep all your job applications organized in one place
            </p>
          </div>
          <div className="rounded-lg bg-card p-6 shadow border border-border">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Kanban Board</h3>
            <p className="text-sm text-muted-foreground">
              Visualize your progress with an intuitive kanban interface
            </p>
          </div>
          <div className="rounded-lg bg-card p-6 shadow border border-border">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">
              Your data is protected with enterprise-grade security
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
