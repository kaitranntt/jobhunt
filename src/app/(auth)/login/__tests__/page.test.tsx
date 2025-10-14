import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ReadonlyURLSearchParams } from 'next/navigation'
import LoginPage from '../page'
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
  useSearchParams: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('LoginPage', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()
  const mockSignIn = vi.fn()
  const mockSignInWithOAuth = vi.fn()
  let currentSearchParams: ReadonlyURLSearchParams

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()

    currentSearchParams = new URLSearchParams() as ReadonlyURLSearchParams

    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    } as unknown as ReturnType<typeof useRouter>)

    vi.mocked(createClient).mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
        signInWithOAuth: mockSignInWithOAuth,
      },
    } as unknown as ReturnType<typeof createClient>)

    vi.mocked(useSearchParams).mockImplementation(() => currentSearchParams)

    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })
  })

  it('should render login form with all required fields', () => {
    renderWithTheme(<LoginPage />)

    expect(screen.getByRole('heading', { name: /sign in to jobhunt/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
  })

  it('should update email and password fields on input', () => {
    renderWithTheme(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput.value).toBe('test@example.com')
    expect(passwordInput.value).toBe('password123')
  })

  it('should handle successful login', async () => {
    mockSignIn.mockResolvedValue({ data: {}, error: null })
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })

    renderWithTheme(<LoginPage />)

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
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })

    renderWithTheme(<LoginPage />)

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
      () => new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 100))
    )
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })

    renderWithTheme(<LoginPage />)

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
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null })

    renderWithTheme(<LoginPage />)

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
    renderWithTheme(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should have link to signup page', () => {
    renderWithTheme(<LoginPage />)

    const signupLink = screen.getByRole('link', { name: /sign up/i })
    expect(signupLink).toHaveAttribute('href', '/signup')
  })

  it('should initiate Google sign in flow when button is clicked', async () => {
    renderWithTheme(<LoginPage />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalled()
    })

    const callArgs = mockSignInWithOAuth.mock.calls.at(-1)?.[0]

    const expectedRedirect = `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent('/dashboard')}`

    expect(callArgs).toMatchObject({
      provider: 'google',
      options: {
        redirectTo: expectedRedirect,
      },
    })
  })

  it('should display error when Google sign in fails', async () => {
    const googleError = 'Google auth blocked'
    mockSignInWithOAuth.mockResolvedValue({
      data: null,
      error: new Error(googleError),
    })

    renderWithTheme(<LoginPage />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(screen.getByText(googleError)).toBeInTheDocument()
    })
  })

  it('should show error from search params when present', () => {
    currentSearchParams = new URLSearchParams('error=OAuth%20failed') as ReadonlyURLSearchParams

    renderWithTheme(<LoginPage />)

    expect(screen.getByText('OAuth failed')).toBeInTheDocument()
  })
})
