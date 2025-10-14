'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import type { Contact } from '@/lib/types/database.types'
import { getContactsByApplication, deleteContact } from '@/lib/api/contacts'
import ContactCard from './ContactCard'
import ContactForm from './ContactForm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ContactListProps {
  applicationId: string
}

export default function ContactList({ applicationId }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null)

  const fetchContacts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getContactsByApplication(applicationId)
      setContacts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [applicationId])

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false)
    fetchContacts()
  }

  const handleEditSuccess = () => {
    setEditingContact(null)
    fetchContacts()
  }

  const handleDeleteConfirm = async () => {
    if (!deletingContactId) return

    try {
      await deleteContact(deletingContactId)
      setDeletingContactId(null)
      fetchContacts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact')
      setDeletingContactId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 glass-ultra rounded-glass">
        <p className="text-label-secondary">Loading contacts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="glass-light rounded-glass p-4 text-sm shadow-glass-soft"
        style={{ border: '1px solid var(--color-error)', color: 'var(--color-error)' }}
      >
        Failed to load contacts: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-label-primary">Contacts</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="btn-glass font-semibold">
              <Plus className="size-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-2xl glass-heavy rounded-glass shadow-glass-medium"
            style={{ border: '1px solid var(--glass-border-strong)' }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-label-primary">
                Add Contact
              </DialogTitle>
            </DialogHeader>
            <ContactForm applicationId={applicationId} onSuccess={handleAddSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <div
          className="glass-ultra rounded-glass p-8 text-center"
          style={{ border: '1px dashed var(--glass-border-medium)' }}
        >
          <p className="text-sm text-label-secondary">
            No contacts yet. Add your first contact to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={() => setEditingContact(contact)}
              onDelete={() => setDeletingContactId(contact.id)}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editingContact !== null}
        onOpenChange={open => !open && setEditingContact(null)}
      >
        <DialogContent
          className="max-w-2xl glass-heavy rounded-glass shadow-glass-medium"
          style={{ border: '1px solid var(--glass-border-strong)' }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-label-primary">
              Edit Contact
            </DialogTitle>
          </DialogHeader>
          {editingContact && (
            <ContactForm
              applicationId={applicationId}
              onSuccess={handleEditSuccess}
              initialData={editingContact}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deletingContactId !== null}
        onOpenChange={open => !open && setDeletingContactId(null)}
      >
        <AlertDialogContent
          className="glass-heavy rounded-glass shadow-glass-strong"
          style={{ border: '1px solid var(--glass-border-strong)' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-label-primary">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-label-secondary">
              This action cannot be undone. This will permanently delete this contact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-glass">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="btn-glass"
              style={{ background: 'var(--color-error)', color: 'white' }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <div
          className="glass-light rounded-glass p-3 text-sm shadow-glass-soft"
          style={{ border: '1px solid var(--color-error)', color: 'var(--color-error)' }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
