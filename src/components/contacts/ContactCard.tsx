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
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">{contact.name}</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label="Edit contact"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Delete contact"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {contact.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="size-4 text-muted-foreground" />
            <span className="break-all">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="size-4 text-muted-foreground" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.role && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="size-4 text-muted-foreground" />
            <span>{contact.role}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
