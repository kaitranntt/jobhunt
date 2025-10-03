import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NavBar } from '@/components/layout/NavBar'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-background">
      <NavBar variant="authenticated" user={{ email: user.email ?? '' }} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Recent Applications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage your job applications
          </p>
        </div>

        {applications && applications.length > 0 ? (
          <div className="overflow-hidden bg-card shadow sm:rounded-md border border-border">
            <ul role="list" className="divide-y divide-border">
              {applications.map(app => (
                <li key={app.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <p className="truncate text-sm font-medium text-primary">
                          {app.job_title}
                        </p>
                        <p className="mt-1 text-sm text-foreground">{app.company_name}</p>
                      </div>
                      <div className="ml-2 flex flex-shrink-0">
                        <span className="inline-flex rounded-full bg-green-100 dark:bg-green-900/30 px-2 text-xs font-semibold leading-5 text-green-800 dark:text-green-400">
                          {app.status}
                        </span>
                      </div>
                    </div>
                    {app.location && (
                      <p className="mt-2 text-sm text-muted-foreground">{app.location}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-foreground">No applications</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by adding your first job application.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
