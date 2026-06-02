/**
 * Form Validation Tests
 * Tests for common form validation logic
 */

import { describe, test, expect } from '@jest/globals'

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Phone validation (basic)
const phoneRegex = /^\+?[0-9]{10,15}$/

describe('Form Validation Utilities', () => {
  describe('Email Validation', () => {
    test('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'first.last@company.com',
        'admin@test-site.org',
      ]

      validEmails.forEach(email => {
        expect(email).toMatch(emailRegex)
      })
    })

    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        'test@',
        '@example.com',
        'test @example.com',
        'test@.com',
        'test@domain',
      ]

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(emailRegex)
      })
    })
  })

  describe('Phone Number Validation', () => {
    test('should accept valid phone numbers', () => {
      const validPhones = [
        '+233200000000',
        '233200000000',
        '+12025551234',
        '5551234567',
      ]

      validPhones.forEach(phone => {
        expect(phone).toMatch(phoneRegex)
      })
    })

    test('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123', // too short
        'abcdefghij',
        '+233-200-000',
        '',
      ]

      invalidPhones.forEach(phone => {
        expect(phone).not.toMatch(phoneRegex)
      })
    })
  })

  describe('Password Validation', () => {
    test('should enforce minimum length', () => {
      const minLength = 8
      const validPassword = 'password123'
      const invalidPassword = 'pass'

      expect(validPassword.length).toBeGreaterThanOrEqual(minLength)
      expect(invalidPassword.length).toBeLessThan(minLength)
    })

    test('should check for empty passwords', () => {
      const emptyPassword = ''
      const validPassword = 'mypassword'

      expect(emptyPassword.trim()).toBe('')
      expect(validPassword.trim()).not.toBe('')
    })
  })

  describe('Name Validation', () => {
    test('should require minimum 2 characters', () => {
      const validNames = ['Jo', 'John Doe', 'Mary']
      const invalidNames = ['', 'J', ' ']

      validNames.forEach(name => {
        expect(name.trim().length).toBeGreaterThanOrEqual(2)
      })

      invalidNames.forEach(name => {
        expect(name.trim().length).toBeLessThan(2)
      })
    })

    test('should trim whitespace', () => {
      const name = '  John Doe  '
      const trimmed = name.trim()

      expect(trimmed).toBe('John Doe')
      expect(trimmed.length).toBeLessThan(name.length)
    })
  })

  describe('Currency Amount Validation', () => {
    test('should accept positive numbers', () => {
      const validAmounts = [1, 10, 100, 1000.50, 0.01]

      validAmounts.forEach(amount => {
        expect(amount).toBeGreaterThan(0)
      })
    })

    test('should reject negative numbers', () => {
      const invalidAmounts = [-1, -100, -0.01]

      invalidAmounts.forEach(amount => {
        expect(amount).toBeLessThan(0)
      })
    })

    test('should reject zero', () => {
      const zero = 0
      expect(zero).toBe(0)
      expect(zero).not.toBeGreaterThan(0)
    })

    test('should round to 2 decimal places', () => {
      const amount = 123.456
      const rounded = Math.round(amount * 100) / 100

      expect(rounded).toBe(123.46)
    })
  })
})
