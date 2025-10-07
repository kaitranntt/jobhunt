import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import SignupPage from '../page'
import { createClient } from '@/lib/supabase/client'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'

// Mock the client-side profiles API module
vi.mock('@/lib/api/profiles', () => ({
  createUserProfile: vi.fn(),
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
}))

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('SignupPage', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()
  const mockSignUp = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()
    setupMatchMedia()

    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    } as unknown as ReturnType<typeof useRouter>)

    vi.mocked(createClient).mockReturnValue({
      auth: {
        signUp: mockSignUp,
        signInWithOAuth: vi.fn(),
      },
    } as unknown as ReturnType<typeof createClient>)

    // Import and setup the mocked function
    const { createUserProfile } = await import('@/lib/api/profiles')
    vi.mocked(createUserProfile).mockResolvedValue({
      id: 'profile-1',
      user_id: 'user-123',
      full_name: 'Test User',
      phone: null,
      location: null,
      job_role: null,
      desired_roles: null,
      desired_industries: null,
      experience_years: null,
      linkedin_url: null,
      portfolio_url: null,
      created_at: '2025-10-04T10:00:00Z',
      updated_at: '2025-10-04T10:00:00Z',
    })
  })

  it('should render step 1 (account credentials) initially', () => {
    renderWithTheme(<SignupPage />)

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /account credentials/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password \(min\. 6 characters\)/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument()
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
  })

  it('should update email and password fields on input', () => {
    renderWithTheme(<SignupPage />)

    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/password \(min\. 6 characters\)/i) as HTMLInputElement

    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput.value).toBe('newuser@example.com')
    expect(passwordInput.value).toBe('password123')
  })

  it('should validate email and password before moving to step 2', async () => {
    renderWithTheme(<SignupPage />)

    const nextButton = screen.getByRole('button', { name: /^next$/i })

    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText(/email and password are required/i)).toBeInTheDocument()
    })
  })

  it('should move to step 2 after valid step 1', async () => {
    renderWithTheme(<SignupPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password \(min\. 6 characters\)/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    const nextButton = screen.getByRole('button', { name: /^next$/i })
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument()
      expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument()
    })
  })

  it('should allow navigation back from step 2 to step 1', async () => {
    renderWithTheme(<SignupPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password \(min\. 6 characters\)/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument()
    })

    const backButton = screen.getByRole('button', { name: /^back$/i })
    fireEvent.click(backButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /account credentials/i })).toBeInTheDocument()
      expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
    })
  })

  it('should require full name in step 2', async () => {
    renderWithTheme(<SignupPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password \(min\. 6 characters\)/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument()
    })

    const nextButton = screen.getByRole('button', { name: /^next$/i })
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
    })
  })

  it('should allow skipping optional steps', async () => {
    renderWithTheme(<SignupPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password \(min\. 6 characters\)/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/full name/i)
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })

    const skipButton = screen.getByRole('button', { name: /^skip$/i })
    fireEvent.click(skipButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /professional info/i })).toBeInTheDocument()
      expect(screen.getByText(/step 3 of 4/i)).toBeInTheDocument()
    })
  })

  it('should complete full signup flow with all steps', async () => {
    const { createUserProfile } = await import('@/lib/api/profiles')

    mockSignUp.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    vi.mocked(createUserProfile).mockResolvedValue({
      id: 'profile-1',
      user_id: 'user-123',
      full_name: 'John Doe',
      phone: null,
      location: null,
      job_role: null,
      desired_roles: null,
      desired_industries: null,
      experience_years: null,
      linkedin_url: null,
      portfolio_url: null,
      created_at: '2025-10-04T10:00:00Z',
      updated_at: '2025-10-04T10:00:00Z',
    })

    renderWithTheme(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '+1234567890' } })
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'San Francisco, CA' } })
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /professional info/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/current role/i), { target: { value: 'Software Engineer' } })
    fireEvent.change(screen.getByLabelText(/years of experience/i), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText(/linkedin url/i), {
      target: { value: 'https://linkedin.com/in/johndoe' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /job preferences/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/desired roles/i), { target: { value: 'Senior Engineer, Tech Lead' } })
    fireEvent.change(screen.getByLabelText(/desired industries/i), { target: { value: 'Technology, FinTech' } })

    const completeButton = screen.getByRole('button', { name: /complete signup/i })
    fireEvent.click(completeButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(createUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          full_name: 'John Doe',
          phone: '+1234567890',
          location: 'San Francisco, CA',
          job_role: 'Software Engineer',
          experience_years: 5,
          linkedin_url: 'https://linkedin.com/in/johndoe',
          desired_roles: ['Senior Engineer', 'Tech Lead'],
          desired_industries: ['Technology', 'FinTech'],
        })
      )
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('should validate URL formats in step 3', async () => {
    renderWithTheme(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /professional info/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/linkedin url/i), { target: { value: 'not-a-url' } })

    const nextButton = screen.getByRole('button', { name: /^next$/i })
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText(/linkedin url must be a valid url/i)).toBeInTheDocument()
    })
  })

  it('should display error message on signup failure', async () => {
    const errorMessage = 'User already registered'
    mockSignUp.mockResolvedValue({
      data: null,
      error: new Error(errorMessage),
    })

    renderWithTheme(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /professional info/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /job preferences/i })).toBeInTheDocument()
    })

    const completeButton = screen.getByRole('button', { name: /complete signup/i })
    fireEvent.click(completeButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should have link to login page', () => {
    renderWithTheme(<SignupPage />)

    const loginLink = screen.getByRole('link', { name: /sign in/i })
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('should show progress indicator', () => {
    renderWithTheme(<SignupPage />)

    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
    expect(screen.getByText(/25% complete/i)).toBeInTheDocument()
  })
})
