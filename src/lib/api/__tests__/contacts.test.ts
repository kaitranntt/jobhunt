import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getContactsByApplication,
  getContactsByUser,
  createContact,
  updateContact,
  deleteContact,
} from '../contacts'
import type { Contact } from '@/lib/types/database.types'

// Mock the Supabase client
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

const mockContacts: Contact[] = [
  {
    id: '1',
    user_id: 'user-1',
    application_id: 'app-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    role: 'Recruiter',
    notes: 'Very helpful',
    created_at: '2025-10-04T10:00:00Z',
    updated_at: '2025-10-04T10:00:00Z',
  },
  {
    id: '2',
    user_id: 'user-1',
    application_id: 'app-1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: null,
    role: 'Hiring Manager',
    notes: null,
    created_at: '2025-10-04T11:00:00Z',
    updated_at: '2025-10-04T11:00:00Z',
  },
]

describe('Contacts API', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock chain
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })
  })

  describe('getContactsByApplication', () => {
    it('should fetch contacts for a specific application', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockReturnValue({
        order: mockOrder,
      })
      mockOrder.mockResolvedValue({
        data: mockContacts,
        error: null,
      })

      const result = await getContactsByApplication('app-1')

      expect(mockFrom).toHaveBeenCalledWith('contacts')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('application_id', 'app-1')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockContacts)
    })

    it('should handle errors when fetching by application', async () => {
      const errorMessage = 'Database error'
      mockSelect.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockReturnValue({
        order: mockOrder,
      })
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      })

      await expect(getContactsByApplication('app-1')).rejects.toThrow(
        `Failed to fetch contacts: ${errorMessage}`
      )
    })
  })

  describe('getContactsByUser', () => {
    it('should fetch all contacts for a user', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockReturnValue({
        order: mockOrder,
      })
      mockOrder.mockResolvedValue({
        data: mockContacts,
        error: null,
      })

      const result = await getContactsByUser('user-1')

      expect(mockFrom).toHaveBeenCalledWith('contacts')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockContacts)
    })

    it('should handle errors when fetching by user', async () => {
      const errorMessage = 'Database error'
      mockSelect.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockReturnValue({
        order: mockOrder,
      })
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      })

      await expect(getContactsByUser('user-1')).rejects.toThrow(
        `Failed to fetch contacts: ${errorMessage}`
      )
    })
  })

  describe('createContact', () => {
    it('should create a new contact', async () => {
      const newContact = {
        user_id: 'user-1',
        application_id: 'app-1',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+1 (555) 999-8888',
        role: 'Technical Lead',
        notes: 'Met at career fair',
      }

      mockInsert.mockReturnValue({
        select: mockSelect,
      })
      mockSelect.mockReturnValue({
        single: mockSingle,
      })
      mockSingle.mockResolvedValue({
        data: { ...newContact, id: '3', created_at: '2025-10-04T12:00:00Z', updated_at: '2025-10-04T12:00:00Z' },
        error: null,
      })

      const result = await createContact(newContact)

      expect(mockFrom).toHaveBeenCalledWith('contacts')
      expect(mockInsert).toHaveBeenCalledWith(newContact)
      expect(mockSelect).toHaveBeenCalled()
      expect(mockSingle).toHaveBeenCalled()
      expect(result).toHaveProperty('id')
      expect(result.name).toBe(newContact.name)
    })

    it('should handle errors when creating', async () => {
      const errorMessage = 'Insert failed'
      const newContact = {
        user_id: 'user-1',
        application_id: 'app-1',
        name: 'Bob Johnson',
        email: null,
        phone: null,
        role: null,
        notes: null,
      }

      mockInsert.mockReturnValue({
        select: mockSelect,
      })
      mockSelect.mockReturnValue({
        single: mockSingle,
      })
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      })

      await expect(createContact(newContact)).rejects.toThrow(`Failed to create contact: ${errorMessage}`)
    })
  })

  describe('updateContact', () => {
    it('should update an existing contact', async () => {
      const updates = {
        role: 'Senior Recruiter',
        notes: 'Promoted to senior position',
      }

      mockUpdate.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockReturnValue({
        select: mockSelect,
      })
      mockSelect.mockReturnValue({
        single: mockSingle,
      })
      mockSingle.mockResolvedValue({
        data: { ...mockContacts[0], ...updates },
        error: null,
      })

      const result = await updateContact('1', updates)

      expect(mockFrom).toHaveBeenCalledWith('contacts')
      expect(mockUpdate).toHaveBeenCalledWith(updates)
      expect(mockEq).toHaveBeenCalledWith('id', '1')
      expect(mockSelect).toHaveBeenCalled()
      expect(mockSingle).toHaveBeenCalled()
      expect(result.role).toBe(updates.role)
      expect(result.notes).toBe(updates.notes)
    })

    it('should handle errors when updating', async () => {
      const errorMessage = 'Update failed'
      const updates = { role: 'Manager' }

      mockUpdate.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockReturnValue({
        select: mockSelect,
      })
      mockSelect.mockReturnValue({
        single: mockSingle,
      })
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      })

      await expect(updateContact('1', updates)).rejects.toThrow(`Failed to update contact: ${errorMessage}`)
    })
  })

  describe('deleteContact', () => {
    it('should delete a contact', async () => {
      mockDelete.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockResolvedValue({
        error: null,
      })

      await expect(deleteContact('1')).resolves.toBeUndefined()

      expect(mockFrom).toHaveBeenCalledWith('contacts')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', '1')
    })

    it('should handle errors when deleting', async () => {
      const errorMessage = 'Delete failed'

      mockDelete.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockResolvedValue({
        error: { message: errorMessage },
      })

      await expect(deleteContact('1')).rejects.toThrow(`Failed to delete contact: ${errorMessage}`)
    })
  })
})
