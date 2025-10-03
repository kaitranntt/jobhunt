import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import SignupPage from '../page'
import { createClient } from '@/lib/supabase/client'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'

// Wrapper for ThemeProvider context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('SignupPage', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()
  const mockSignUp = vi.fn()

  beforeEach(() => {
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
  })

  it('should render signup form with all required fields', () => {
    renderWithTheme(<SignupPage />)

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password \(min\. 6 characters\)/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
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

  it('should handle successful signup', async () => {
    mockSignUp.mockResolvedValue({ data: {}, error: null })

    renderWithTheme(<SignupPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password \(min\. 6 characters\)/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('should display error message on signup failure', async () => {
    const errorMessage = 'User already registered'
    mockSignUp.mockResolvedValue({
      data: null,
      error: new Error(errorMessage),
    })

    renderWithTheme(<SignupPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password \(min\. 6 characters\)/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should show loading state during signup', async () => {
    mockSignUp.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ data: {}, error: null }), 100)
        )
    )

    renderWithTheme(<SignupPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password \(min\. 6 characters\)/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/creating account/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText(/^sign up$/i)).toBeInTheDocument()
    })
  })

  it('should clear error message on new submission', async () => {
    mockSignUp
      .mockResolvedValueOnce({
        data: null,
        error: new Error('First error'),
      })
      .mockResolvedValueOnce({ data: {}, error: null })

    renderWithTheme(<SignupPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password \(min\. 6 characters\)/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    // First submission with error
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'weak' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument()
    })

    // Second submission should clear error
    fireEvent.change(passwordInput, { target: { value: 'strong123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument()
    })
  })

  it('should require email and password fields with minimum length', () => {
    renderWithTheme(<SignupPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password \(min\. 6 characters\)/i)

    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('minLength', '6')
  })

  it('should have link to login page', () => {
    renderWithTheme(<SignupPage />)

    const loginLink = screen.getByRole('link', { name: /sign in/i })
    expect(loginLink).toHaveAttribute('href', '/login')
  })
})
