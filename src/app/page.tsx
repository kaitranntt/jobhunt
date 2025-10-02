import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <main className="container mx-auto px-4 text-center">
        <h1 className="mb-6 text-5xl font-bold text-gray-900">JobHunt</h1>
        <p className="mb-8 text-xl text-gray-600">Track your job applications efficiently</p>
        <p className="mb-12 text-gray-500">
          Organize applications, track interview progress, and land your dream job
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-md bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">Track Applications</h3>
            <p className="text-sm text-gray-600">
              Keep all your job applications organized in one place
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">Kanban Board</h3>
            <p className="text-sm text-gray-600">
              Visualize your progress with an intuitive kanban interface
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">Secure & Private</h3>
            <p className="text-sm text-gray-600">
              Your data is protected with enterprise-grade security
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
