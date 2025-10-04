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
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading contacts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
        Failed to load contacts: {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contacts</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
            </DialogHeader>
            <ContactForm
              applicationId={applicationId}
              onSuccess={handleAddSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No contacts yet. Add your first contact to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
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
        onOpenChange={(open) => !open && setEditingContact(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
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
        onOpenChange={(open) => !open && setDeletingContactId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this contact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
