import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold">JobHunt</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">{user.email}</span>
              <form action="/auth/signout" method="post" className="ml-4">
                <button
                  type="submit"
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Recent Applications</h2>
          <p className="mt-1 text-sm text-gray-600">
            Track and manage your job applications
          </p>
        </div>

        {applications && applications.length > 0 ? (
          <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {applications.map(app => (
                <li key={app.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <p className="truncate text-sm font-medium text-indigo-600">
                          {app.job_title}
                        </p>
                        <p className="mt-1 text-sm text-gray-900">{app.company_name}</p>
                      </div>
                      <div className="ml-2 flex flex-shrink-0">
                        <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                          {app.status}
                        </span>
                      </div>
                    </div>
                    {app.location && (
                      <p className="mt-2 text-sm text-gray-500">{app.location}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No applications</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first job application.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
