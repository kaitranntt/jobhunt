import { describe, it, expect } from 'vitest'
import {
  applicationFormSchema,
  createApplicationSchema,
  updateApplicationSchema,
  applicationStatusSchema,
} from '../application.schema'

describe('applicationStatusSchema', () => {
  it('should accept valid status values', () => {
    const validStatuses = [
      'wishlist',
      'applied',
      'phone_screen',
      'assessment',
      'take_home',
      'interviewing',
      'final_round',
      'offered',
      'accepted',
      'rejected',
      'withdrawn',
      'ghosted',
    ]

    validStatuses.forEach(status => {
      expect(() => applicationStatusSchema.parse(status)).not.toThrow()
    })
  })

  it('should reject invalid status values', () => {
    expect(() => applicationStatusSchema.parse('invalid_status')).toThrow()
    expect(() => applicationStatusSchema.parse('')).toThrow()
    expect(() => applicationStatusSchema.parse(null)).toThrow()
  })
})

describe('applicationFormSchema', () => {
  const validApplicationData = {
    company_name: 'Acme Corp',
    job_title: 'Software Engineer',
    job_url: 'https://example.com/jobs/123',
    location: 'San Francisco, CA',
    salary_range: '$120k - $150k',
    status: 'applied',
    date_applied: '2025-10-02',
    notes: 'Applied through referral',
  }

  it('should validate a complete valid application', () => {
    const result = applicationFormSchema.safeParse(validApplicationData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validApplicationData)
    }
  })

  it('should require company_name', () => {
    const data = { ...validApplicationData, company_name: '' }
    const result = applicationFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Company name is required')
    }
  })

  it('should require job_title', () => {
    const data = { ...validApplicationData, job_title: '' }
    const result = applicationFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Job title is required')
    }
  })

  it('should validate job_url format', () => {
    const invalidUrl = { ...validApplicationData, job_url: 'not-a-url' }
    const result = applicationFormSchema.safeParse(invalidUrl)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Must be a valid URL')
    }
  })

  it('should allow empty string for optional fields', () => {
    const data = {
      ...validApplicationData,
      job_url: '',
      location: '',
      salary_range: '',
      notes: '',
    }
    const result = applicationFormSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should allow null for optional fields', () => {
    const data = {
      ...validApplicationData,
      job_url: null,
      location: null,
      salary_range: null,
      notes: null,
    }
    const result = applicationFormSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should validate date_applied format', () => {
    const invalidDate = { ...validApplicationData, date_applied: '10/02/2025' }
    const result = applicationFormSchema.safeParse(invalidDate)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Date must be in YYYY-MM-DD format')
    }
  })

  it('should apply default status', () => {
    const dataWithoutStatus = {
      company_name: validApplicationData.company_name,
      job_title: validApplicationData.job_title,
      job_url: validApplicationData.job_url,
      location: validApplicationData.location,
      salary_range: validApplicationData.salary_range,
      date_applied: validApplicationData.date_applied,
      notes: validApplicationData.notes,
    }
    const result = applicationFormSchema.safeParse(dataWithoutStatus)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('wishlist')
    }
  })

  it('should enforce company_name max length', () => {
    const data = { ...validApplicationData, company_name: 'a'.repeat(256) }
    const result = applicationFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 255 characters')
    }
  })

  it('should enforce notes max length', () => {
    const data = { ...validApplicationData, notes: 'a'.repeat(5001) }
    const result = applicationFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 5000 characters')
    }
  })
})

describe('createApplicationSchema', () => {
  const validCreateData = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    company_name: 'Acme Corp',
    job_title: 'Software Engineer',
    status: 'applied',
    date_applied: '2025-10-02',
  }

  it('should validate complete create data', () => {
    const result = createApplicationSchema.safeParse(validCreateData)
    expect(result.success).toBe(true)
  })

  it('should require user_id', () => {
    const dataWithoutUserId = {
      company_name: validCreateData.company_name,
      job_title: validCreateData.job_title,
      status: validCreateData.status,
      date_applied: validCreateData.date_applied,
    }
    const result = createApplicationSchema.safeParse(dataWithoutUserId)
    expect(result.success).toBe(false)
  })

  it('should validate user_id as UUID', () => {
    const data = { ...validCreateData, user_id: 'not-a-uuid' }
    const result = createApplicationSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid user ID')
    }
  })
})

describe('updateApplicationSchema', () => {
  it('should allow partial updates', () => {
    const partialUpdate = {
      status: 'interviewing',
    }
    const result = updateApplicationSchema.safeParse(partialUpdate)
    expect(result.success).toBe(true)
  })

  it('should allow updating multiple fields', () => {
    const update = {
      status: 'offered',
      notes: 'Received offer letter',
      salary_range: '$140k - $160k',
    }
    const result = updateApplicationSchema.safeParse(update)
    expect(result.success).toBe(true)
  })

  it('should validate updated fields', () => {
    const invalidUpdate = {
      job_url: 'not-a-url',
    }
    const result = updateApplicationSchema.safeParse(invalidUpdate)
    expect(result.success).toBe(false)
  })

  it('should allow empty update object', () => {
    const result = updateApplicationSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
