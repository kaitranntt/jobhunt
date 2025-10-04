'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { contactFormSchema, type ContactFormData } from '@/lib/schemas/contact.schema'
import { createContact, updateContact } from '@/lib/api/contacts'
import type { Contact } from '@/lib/types/database.types'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface ContactFormProps {
  applicationId: string | null
  onSuccess: () => void
  initialData?: Contact
}

export default function ContactForm({
  applicationId,
  onSuccess,
  initialData,
}: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
      role: initialData?.role ?? '',
      notes: initialData?.notes ?? '',
      application_id: applicationId ?? initialData?.application_id ?? null,
    },
  })

  const handleSubmit = async (data: ContactFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      if (initialData) {
        // Update existing contact
        await updateContact(initialData.id, {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          role: data.role || null,
          notes: data.notes || null,
          application_id: data.application_id || null,
        })
      } else {
        // Create new contact
        await createContact({
          user_id: user.id,
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          role: data.role || null,
          notes: data.notes || null,
          application_id: data.application_id || null,
        })
      }

      onSuccess()
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
        noValidate
      >
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Contact Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Contact Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., John Doe"
                    required
                    disabled={isLoading}
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="john.doe@example.com"
                    disabled={isLoading}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    placeholder="555-1234"
                    disabled={isLoading}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., HR Manager, Tech Lead"
                    disabled={isLoading}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Additional notes about this contact..."
                    className="min-h-[100px] resize-y"
                    disabled={isLoading}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Submit'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
