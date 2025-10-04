import { Pencil, Trash2, Mail, Phone, Briefcase } from 'lucide-react'
import type { Contact } from '@/lib/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ContactCardProps {
  contact: Contact
  onEdit: () => void
  onDelete: () => void
}

export default function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  return (
    <Card className="glass-light rounded-glass shadow-glass-soft glass-interactive" style={{ border: '1px solid var(--glass-border-medium)' }}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full glass-medium shadow-glass-soft"
            style={{ border: '1px solid var(--glass-border-medium)' }}
          >
            <span className="text-lg font-semibold text-label-primary">{contact.name.charAt(0).toUpperCase()}</span>
          </div>
          <CardTitle className="text-base font-semibold text-label-primary">{contact.name}</CardTitle>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label="Edit contact"
            className="glass-ultra rounded-full hover:glass-light"
          >
            <Pencil className="size-4 text-label-secondary" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Delete contact"
            className="glass-ultra rounded-full hover:glass-light"
          >
            <Trash2 className="size-4 text-label-secondary" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {contact.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="size-4 text-label-tertiary" />
            <span className="break-all text-label-secondary">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="size-4 text-label-tertiary" />
            <span className="text-label-secondary">{contact.phone}</span>
          </div>
        )}
        {contact.role && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="size-4 text-label-tertiary" />
            <span className="text-label-secondary">{contact.role}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
