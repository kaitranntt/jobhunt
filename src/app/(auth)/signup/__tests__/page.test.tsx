import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import SignupPage from '../page'
import { createClient } from '@/lib/supabase/client'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { ImageMockProps } from '@/test/image-mock.types'

// Mock Next.js Image component to prevent URL parsing errors in test environment
// and avoid ESLint @next/next/no-img-element warnings
vi.mock('next/image', () => ({
  default: ({ alt, 'data-testid': testId, className, style, ...props }: ImageMockProps) => (
    <div
      data-testid={testId || 'next-image-mock'}
      role="img"
      aria-label={alt}
      className={className}
      style={style}
      {...props}
    />
  ),
}))

// Mock the client-side profiles API module
vi.mock('@/lib/api/profiles', () => ({
  createUserProfile: vi.fn(),
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
}))

// Mock the server actions
vi.mock('../actions', () => ({
  createUserProfileAction: vi.fn(),
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

describe('SignupPage with SimplifiedSignupForm', () => {
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
      },
    } as unknown as ReturnType<typeof createClient>)

    // Import and setup the mocked functions
    const { createUserProfileAction } = await import('../actions')

    vi.mocked(createUserProfileAction).mockResolvedValue({
      success: true,
      data: {
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
        created_at: '2025-10-17T10:00:00Z',
        updated_at: '2025-10-17T10:00:00Z',
      },
      error: null,
    })
  })

  it('should render the simplified signup form', () => {
    renderWithTheme(<SignupPage />)

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(
      screen.getByText(/join thousands of professionals who trust jobhunt for career tracking/i)
    ).toBeInTheDocument()

    // Personal Information section
    expect(screen.getByRole('heading', { name: /personal information/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()

    // Account Information section
    expect(screen.getByRole('heading', { name: /account information/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password \(min\. 6 characters\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()

    // Create account button
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()

    // Sign in link
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })

  it('should update form fields on input', () => {
    renderWithTheme(<SignupPage />)

    const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement
    const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement
    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(
      /^password \(min\. 6 characters\)/i
    ) as HTMLInputElement
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement

    fireEvent.change(firstNameInput, { target: { value: 'John' } })
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

    expect(firstNameInput.value).toBe('John')
    expect(lastNameInput.value).toBe('Doe')
    expect(emailInput.value).toBe('john.doe@example.com')
    expect(passwordInput.value).toBe('password123')
    expect(confirmPasswordInput.value).toBe('password123')
  })

  it('should show validation error for empty fields', async () => {
    renderWithTheme(<SignupPage />)

    // Bypass HTML5 validation by calling the submit handler directly
    const form = screen.getByRole('button', { name: /create account/i }).closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(screen.getByText(/all fields are required/i)).toBeInTheDocument()
    })
  })

  it('should show validation error for invalid email format', async () => {
    renderWithTheme(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalid-email' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    })

    // Bypass HTML5 validation by calling the submit handler directly
    const form = screen.getByRole('button', { name: /create account/i }).closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('should show validation error for short password', async () => {
    renderWithTheme(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: '123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: '123' } })

    // Bypass HTML5 validation by calling the submit handler directly
    const form = screen.getByRole('button', { name: /create account/i }).closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('should show validation error for password mismatch', async () => {
    renderWithTheme(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different123' },
    })

    // Bypass HTML5 validation by calling the submit handler directly
    const form = screen.getByRole('button', { name: /create account/i }).closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('should toggle password visibility', () => {
    renderWithTheme(<SignupPage />)

    const passwordInput = screen.getByLabelText(
      /^password \(min\. 6 characters\)/i
    ) as HTMLInputElement
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement

    // Initially password should be hidden
    expect(passwordInput.type).toBe('password')
    expect(confirmPasswordInput.type).toBe('password')

    // Find the toggle buttons (they don't have accessible names, so we find them by their role and position)
    const passwordToggleButtons = screen
      .getAllByRole('button')
      .filter(button => button.querySelector('svg') && !button.textContent)

    // Toggle password visibility
    fireEvent.click(passwordToggleButtons[0])
    expect(passwordInput.type).toBe('text')

    // Toggle back to hidden
    fireEvent.click(passwordToggleButtons[0])
    expect(passwordInput.type).toBe('password')

    // Toggle confirm password visibility
    fireEvent.click(passwordToggleButtons[1])
    expect(confirmPasswordInput.type).toBe('text')

    // Toggle back to hidden
    fireEvent.click(passwordToggleButtons[1])
    expect(confirmPasswordInput.type).toBe('password')
  })

  it('should handle successful form submission', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    renderWithTheme(<SignupPage />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    })

    const createAccountButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(createAccountButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        password: 'password123',
      })
    })

    const { createUserProfileAction } = await import('../actions')
    await waitFor(() => {
      expect(createUserProfileAction).toHaveBeenCalledWith({
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
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('should handle signup error', async () => {
    const errorMessage = 'User already registered'
    mockSignUp.mockResolvedValue({
      data: null,
      error: new Error(errorMessage),
    })

    renderWithTheme(<SignupPage />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    })

    const createAccountButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(createAccountButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should handle profile creation error', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const { createUserProfileAction } = await import('../actions')
    vi.mocked(createUserProfileAction).mockResolvedValue({
      success: false,
      data: null,
      error: 'Profile creation failed',
    })

    renderWithTheme(<SignupPage />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    })

    const createAccountButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(createAccountButton)

    await waitFor(() => {
      expect(screen.getByText(/profile creation failed/i)).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should disable all inputs and buttons during loading', async () => {
    mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    renderWithTheme(<SignupPage />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    })

    const createAccountButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(createAccountButton)

    // Check that button shows loading state
    expect(screen.getByRole('button', { name: /creating account\.\.\./i })).toBeInTheDocument()

    // Check that inputs are disabled
    expect(screen.getByLabelText(/first name/i)).toBeDisabled()
    expect(screen.getByLabelText(/last name/i)).toBeDisabled()
    expect(screen.getByLabelText(/email address/i)).toBeDisabled()
    expect(screen.getByLabelText(/^password/i)).toBeDisabled()
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled()
  })

  it('should clear error message when user starts typing', async () => {
    renderWithTheme(<SignupPage />)

    // Submit empty form to trigger error
    const form = screen.getByRole('button', { name: /create account/i }).closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(screen.getByText(/all fields are required/i)).toBeInTheDocument()
    })

    // Start typing in first name field
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })

    // Error should be cleared
    expect(screen.queryByText(/all fields are required/i)).not.toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    renderWithTheme(<SignupPage />)

    // Check that all form controls have proper labels
    expect(screen.getByLabelText(/first name/i)).toHaveAttribute('id', 'firstName')
    expect(screen.getByLabelText(/last name/i)).toHaveAttribute('id', 'lastName')
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('id', 'email')
    expect(screen.getByLabelText(/^password \(min\. 6 characters\)/i)).toHaveAttribute(
      'id',
      'password'
    )
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('id', 'confirmPassword')

    // Check that required fields have the required attribute
    expect(screen.getByLabelText(/first name/i)).toHaveAttribute('required')
    expect(screen.getByLabelText(/last name/i)).toHaveAttribute('required')
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('required')
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('required')
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('required')

    // Check that email and password inputs have proper types
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'password')
  })

  it('should trim whitespace from name fields in submission', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    renderWithTheme(<SignupPage />)

    // Fill out the form with extra whitespace
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: '  John  ' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: '  Doe  ' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    })

    const createAccountButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(createAccountButton)

    const { createUserProfileAction } = await import('../actions')
    await waitFor(() => {
      expect(createUserProfileAction).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'John Doe', // Whitespace should be trimmed
        })
      )
    })
  })
})
