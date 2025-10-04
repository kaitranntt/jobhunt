'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { type ApplicationFormData, type ApplicationStatus } from '@/lib/schemas/application.schema'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

// Define a form-friendly version of the schema that works better with React Hook Form
const formSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(255, 'Company name must be less than 255 characters'),
  job_title: z.string().min(1, 'Job title is required').max(255, 'Job title must be less than 255 characters'),
  job_url: z.string().url('Must be a valid URL').or(z.literal('')),
  location: z.string().max(255, 'Location must be less than 255 characters'),
  salary_range: z.string().max(100, 'Salary range must be less than 100 characters'),
  status: z.enum([
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
  ]),
  date_applied: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().max(5000, 'Notes must be less than 5000 characters'),
})

type FormData = z.infer<typeof formSchema>

interface ApplicationFormProps {
  onSubmit: (data: ApplicationFormData) => void
  initialData?: Partial<ApplicationFormData>
  isLoading?: boolean
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'take_home', label: 'Take Home' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'final_round', label: 'Final Round' },
  { value: 'offered', label: 'Offered' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'ghosted', label: 'Ghosted' },
]

export default function ApplicationForm({
  onSubmit,
  initialData,
  isLoading = false,
}: ApplicationFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: initialData?.company_name ?? '',
      job_title: initialData?.job_title ?? '',
      job_url: initialData?.job_url ?? '',
      location: initialData?.location ?? '',
      salary_range: initialData?.salary_range ?? '',
      status: initialData?.status ?? 'wishlist',
      date_applied: initialData?.date_applied ?? new Date().toISOString().split('T')[0],
      notes: initialData?.notes ?? '',
    },
  })

  const handleSubmit = (data: FormData) => {
    // Cast to ApplicationFormData - the types are compatible
    onSubmit(data as unknown as ApplicationFormData)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
        noValidate
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Company Name */}
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-label-primary font-semibold">Company Name <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Google, Microsoft, Acme Inc."
                    required
                    disabled={isLoading}
                    aria-required="true"
                    className="glass-ultra border-0 text-label-primary placeholder:text-label-tertiary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job Title */}
          <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-label-primary font-semibold">Job Title <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Software Engineer, Product Manager"
                    required
                    disabled={isLoading}
                    aria-required="true"
                    className="glass-ultra border-0 text-label-primary placeholder:text-label-tertiary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job URL */}
          <FormField
            control={form.control}
            name="job_url"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-label-primary font-semibold">Job URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://example.com/job-posting"
                    disabled={isLoading}
                    value={field.value ?? ''}
                    className="glass-ultra border-0 text-label-primary placeholder:text-label-tertiary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label-primary font-semibold">Location</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Remote, San Francisco, CA"
                    disabled={isLoading}
                    value={field.value ?? ''}
                    className="glass-ultra border-0 text-label-primary placeholder:text-label-tertiary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Salary Range */}
          <FormField
            control={form.control}
            name="salary_range"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label-primary font-semibold">Salary Range</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., $100k-$150k"
                    disabled={isLoading}
                    value={field.value ?? ''}
                    className="glass-ultra border-0 text-label-primary placeholder:text-label-tertiary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label-primary font-semibold">Status <span className="text-red-500">*</span></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger aria-label="Status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Applied */}
          <FormField
            control={form.control}
            name="date_applied"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label-primary font-semibold">Date Applied <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    disabled={isLoading}
                    className="glass-ultra border-0 text-label-primary"
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
                <FormLabel className="text-label-primary font-semibold">Notes</FormLabel>
                <p className="text-xs text-label-tertiary mb-2">Additional notes, interview details, etc.</p>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Add any additional notes or interview details here..."
                    className="min-h-[120px] resize-y glass-ultra border-0 text-label-primary placeholder:text-label-tertiary"
                    disabled={isLoading}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-label-quaternary">
          <Button type="submit" disabled={isLoading} className="glass-medium rounded-glass-sm hover:glass-heavy">
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
