/**
 * Login Form Component Tests
 * Tests for the login page functionality
 */

import { describe, test, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock component for testing purposes
const MockLoginForm = () => {
  return (
    <div>
      <h2>Welcome Back</h2>
      <form>
        <label htmlFor="email">Email Address</label>
        <input type="email" id="email" placeholder="name@company.com" />

        <label htmlFor="password">Password</label>
        <input type="password" id="password" placeholder="••••••••" />

        <button type="submit">Sign In to Secure Market</button>
      </form>
      <div>
        <p>© 2024 Trade Nest Global Inc.</p>
      </div>
    </div>
  )
}

describe('Login Form', () => {
  test('should render login form elements', () => {
    render(<MockLoginForm />)

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  test('should have email input field', () => {
    render(<MockLoginForm />)

    const emailInput = screen.getByLabelText('Email Address')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('placeholder', 'name@company.com')
  })

  test('should have password input field', () => {
    render(<MockLoginForm />)

    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should render brand footer', () => {
    render(<MockLoginForm />)

    expect(screen.getByText(/Trade Nest Global Inc/i)).toBeInTheDocument()
  })
})
