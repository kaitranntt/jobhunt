import { describe, it, expect } from 'vitest'
import {
  contactFormSchema,
  createContactSchema,
  updateContactSchema,
} from '../contact.schema'

describe('contactFormSchema', () => {
  const validContactData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    role: 'Recruiter',
    notes: 'Very responsive and helpful',
    application_id: '123e4567-e89b-12d3-a456-426614174000',
  }

  it('should validate a complete valid contact', () => {
    const result = contactFormSchema.safeParse(validContactData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validContactData)
    }
  })

  it('should require name', () => {
    const data = { ...validContactData, name: '' }
    const result = contactFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Contact name is required')
    }
  })

  it('should validate email format', () => {
    const invalidEmail = { ...validContactData, email: 'not-an-email' }
    const result = contactFormSchema.safeParse(invalidEmail)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Must be a valid email address')
    }
  })

  it('should allow empty string for optional fields', () => {
    const data = {
      name: 'John Doe',
      email: '',
      phone: '',
      role: '',
      notes: '',
      application_id: null,
    }
    const result = contactFormSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should allow null for optional fields', () => {
    const data = {
      name: 'John Doe',
      email: null,
      phone: null,
      role: null,
      notes: null,
      application_id: null,
    }
    const result = contactFormSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should enforce name max length', () => {
    const data = { ...validContactData, name: 'a'.repeat(256) }
    const result = contactFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 255 characters')
    }
  })

  it('should enforce phone max length', () => {
    const data = { ...validContactData, phone: 'a'.repeat(51) }
    const result = contactFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 50 characters')
    }
  })

  it('should enforce role max length', () => {
    const data = { ...validContactData, role: 'a'.repeat(101) }
    const result = contactFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 100 characters')
    }
  })

  it('should enforce notes max length', () => {
    const data = { ...validContactData, notes: 'a'.repeat(5001) }
    const result = contactFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 5000 characters')
    }
  })

  it('should validate application_id as UUID', () => {
    const data = { ...validContactData, application_id: 'not-a-uuid' }
    const result = contactFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid application ID')
    }
  })

  it('should allow contact without application_id', () => {
    const data = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: null,
      role: 'HR Manager',
      notes: null,
      application_id: null,
    }
    const result = contactFormSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})

describe('createContactSchema', () => {
  const validCreateData = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com',
    phone: null,
    role: 'Recruiter',
    notes: null,
    application_id: '223e4567-e89b-12d3-a456-426614174000',
  }

  it('should validate complete create data', () => {
    const result = createContactSchema.safeParse(validCreateData)
    expect(result.success).toBe(true)
  })

  it('should require user_id', () => {
    const dataWithoutUserId = {
      name: validCreateData.name,
      email: validCreateData.email,
      phone: validCreateData.phone,
      role: validCreateData.role,
      notes: validCreateData.notes,
      application_id: validCreateData.application_id,
    }
    const result = createContactSchema.safeParse(dataWithoutUserId)
    expect(result.success).toBe(false)
  })

  it('should validate user_id as UUID', () => {
    const data = { ...validCreateData, user_id: 'not-a-uuid' }
    const result = createContactSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid user ID')
    }
  })

  it('should allow minimal contact with just user_id and name', () => {
    const minimalData = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Jane Doe',
    }
    const result = createContactSchema.safeParse(minimalData)
    expect(result.success).toBe(true)
  })
})

describe('updateContactSchema', () => {
  it('should allow partial updates', () => {
    const partialUpdate = {
      role: 'Hiring Manager',
    }
    const result = updateContactSchema.safeParse(partialUpdate)
    expect(result.success).toBe(true)
  })

  it('should allow updating multiple fields', () => {
    const update = {
      email: 'newemail@example.com',
      phone: '+1 (555) 999-8888',
      notes: 'Updated contact information',
    }
    const result = updateContactSchema.safeParse(update)
    expect(result.success).toBe(true)
  })

  it('should validate updated fields', () => {
    const invalidUpdate = {
      email: 'not-an-email',
    }
    const result = updateContactSchema.safeParse(invalidUpdate)
    expect(result.success).toBe(false)
  })

  it('should allow empty update object', () => {
    const result = updateContactSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should validate application_id in updates', () => {
    const invalidUpdate = {
      application_id: 'not-a-uuid',
    }
    const result = updateContactSchema.safeParse(invalidUpdate)
    expect(result.success).toBe(false)
  })
})
