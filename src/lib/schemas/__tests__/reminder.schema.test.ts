import { describe, it, expect } from 'vitest'
import {
  reminderFormSchema,
  createReminderSchema,
  updateReminderSchema,
} from '../reminder.schema'

describe('reminderFormSchema', () => {
  const validReminderData = {
    title: 'Follow up on application',
    description: 'Send a follow-up email to the hiring manager',
    reminder_date: '2025-10-10T10:00:00Z',
    is_completed: false,
  }

  it('should validate a complete valid reminder', () => {
    const result = reminderFormSchema.safeParse(validReminderData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validReminderData)
    }
  })

  it('should require title', () => {
    const data = { ...validReminderData, title: '' }
    const result = reminderFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title is required')
    }
  })

  it('should require reminder_date', () => {
    const dataWithoutDate = {
      title: validReminderData.title,
      description: validReminderData.description,
      is_completed: validReminderData.is_completed,
    }
    const result = reminderFormSchema.safeParse(dataWithoutDate)
    expect(result.success).toBe(false)
  })

  it('should reject past dates', () => {
    const pastDate = { ...validReminderData, reminder_date: '2020-01-01T10:00:00Z' }
    const result = reminderFormSchema.safeParse(pastDate)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Reminder date must be in the future')
    }
  })

  it('should accept future dates', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const data = { ...validReminderData, reminder_date: futureDate.toISOString() }
    const result = reminderFormSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should allow empty description', () => {
    const data = { ...validReminderData, description: '' }
    const result = reminderFormSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should allow null description', () => {
    const data = { ...validReminderData, description: null }
    const result = reminderFormSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should default is_completed to false', () => {
    const dataWithoutCompleted = {
      title: validReminderData.title,
      description: validReminderData.description,
      reminder_date: validReminderData.reminder_date,
    }
    const result = reminderFormSchema.safeParse(dataWithoutCompleted)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_completed).toBe(false)
    }
  })

  it('should enforce title max length', () => {
    const data = { ...validReminderData, title: 'a'.repeat(256) }
    const result = reminderFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 255 characters')
    }
  })

  it('should enforce description max length', () => {
    const data = { ...validReminderData, description: 'a'.repeat(1001) }
    const result = reminderFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 1000 characters')
    }
  })
})

describe('createReminderSchema', () => {
  const validCreateData = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    application_id: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Follow up on application',
    description: 'Send a follow-up email',
    reminder_date: '2025-10-10T10:00:00Z',
    is_completed: false,
  }

  it('should validate complete create data', () => {
    const result = createReminderSchema.safeParse(validCreateData)
    expect(result.success).toBe(true)
  })

  it('should require user_id', () => {
    const dataWithoutUserId = {
      application_id: validCreateData.application_id,
      title: validCreateData.title,
      reminder_date: validCreateData.reminder_date,
    }
    const result = createReminderSchema.safeParse(dataWithoutUserId)
    expect(result.success).toBe(false)
  })

  it('should validate user_id as UUID', () => {
    const data = { ...validCreateData, user_id: 'not-a-uuid' }
    const result = createReminderSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid user ID')
    }
  })

  it('should validate application_id as UUID when provided', () => {
    const data = { ...validCreateData, application_id: 'not-a-uuid' }
    const result = createReminderSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid application ID')
    }
  })

  it('should allow null application_id', () => {
    const data = { ...validCreateData, application_id: null }
    const result = createReminderSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})

describe('updateReminderSchema', () => {
  it('should allow partial updates', () => {
    const partialUpdate = {
      title: 'Updated title',
    }
    const result = updateReminderSchema.safeParse(partialUpdate)
    expect(result.success).toBe(true)
  })

  it('should allow updating multiple fields', () => {
    const update = {
      title: 'Updated reminder',
      description: 'New description',
      is_completed: true,
    }
    const result = updateReminderSchema.safeParse(update)
    expect(result.success).toBe(true)
  })

  it('should validate updated fields', () => {
    const invalidUpdate = {
      title: 'a'.repeat(256),
    }
    const result = updateReminderSchema.safeParse(invalidUpdate)
    expect(result.success).toBe(false)
  })

  it('should allow empty update object', () => {
    const result = updateReminderSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should reject past reminder_date on update', () => {
    const update = {
      reminder_date: '2020-01-01T10:00:00Z',
    }
    const result = updateReminderSchema.safeParse(update)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Reminder date must be in the future')
    }
  })
})
