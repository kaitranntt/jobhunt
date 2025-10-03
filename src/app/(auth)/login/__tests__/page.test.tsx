import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from '../page'
import { createClient } from '@/lib/supabase/client'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('LoginPage', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()
  const mockSignIn = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    } as unknown as ReturnType<typeof useRouter>)

    vi.mocked(createClient).mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    } as unknown as ReturnType<typeof createClient>)
  })

  it('should render login form with all required fields', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { name: /sign in to jobhunt/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
  })

  it('should update email and password fields on input', () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput.value).toBe('test@example.com')
    expect(passwordInput.value).toBe('password123')
  })

  it('should handle successful login', async () => {
    mockSignIn.mockResolvedValue({ data: {}, error: null })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('should display error message on login failure', async () => {
    const errorMessage = 'Invalid login credentials'
    mockSignIn.mockResolvedValue({
      data: null,
      error: new Error(errorMessage),
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should show loading state during login', async () => {
    mockSignIn.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ data: {}, error: null }), 100)
        )
    )

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText(/^sign in$/i)).toBeInTheDocument()
    })
  })

  it('should clear error message on new submission', async () => {
    mockSignIn
      .mockResolvedValueOnce({
        data: null,
        error: new Error('First error'),
      })
      .mockResolvedValueOnce({ data: {}, error: null })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // First submission with error
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrong' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument()
    })

    // Second submission should clear error
    fireEvent.change(passwordInput, { target: { value: 'correct' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument()
    })
  })

  it('should require email and password fields', () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should have link to signup page', () => {
    render(<LoginPage />)

    const signupLink = screen.getByRole('link', { name: /sign up/i })
    expect(signupLink).toHaveAttribute('href', '/signup')
  })
})
