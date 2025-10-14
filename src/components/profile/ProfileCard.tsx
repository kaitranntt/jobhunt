'use client'

import * as React from 'react'
import { User, MapPin, Briefcase, Calendar, Edit, ExternalLink, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { UserProfile } from '@/lib/types/database.types'
import type { ProfileFormData } from '@/lib/schemas/profile.schema'
import { getUserProfile, updateUserProfile } from '@/lib/api/profiles'
import { profileFormSchema } from '@/lib/schemas/profile.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

interface ProfileCardProps {
  userId: string
  user?: { email?: string | null }
}

export function ProfileCard({ userId, user }: ProfileCardProps) {
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      location: '',
      job_role: '',
      desired_roles: [],
      desired_industries: [],
      experience_years: null,
      linkedin_url: '',
      portfolio_url: '',
    },
  })

  // Load profile data
  React.useEffect(() => {
    async function loadProfile() {
      try {
        const profileData = await getUserProfile(userId)
        setProfile(profileData)

        if (profileData) {
          form.reset({
            full_name: profileData.full_name,
            phone: profileData.phone || '',
            location: profileData.location || '',
            job_role: profileData.job_role || '',
            desired_roles: profileData.desired_roles || [],
            desired_industries: profileData.desired_industries || [],
            experience_years: profileData.experience_years,
            linkedin_url: profileData.linkedin_url || '',
            portfolio_url: profileData.portfolio_url || '',
          })
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
        // TODO: Add error notification system
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      loadProfile()
    }
  }, [userId, form])

  const handleUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdating(true)
    try {
      const updatedProfile = await updateUserProfile(userId, data)
      setProfile(updatedProfile)
      setIsEditModalOpen(false)
      // TODO: Add success notification system
    } catch (error) {
      console.error('Failed to update profile:', error)
      // TODO: Add error notification system
      throw error // Re-throw to let form handle the error
    } finally {
      setIsUpdating(false)
    }
  }

  const addDesiredRole = (role: string) => {
    if (role.trim() && !form.getValues('desired_roles')?.includes(role.trim())) {
      const current = form.getValues('desired_roles') || []
      form.setValue('desired_roles', [...current, role.trim()])
    }
  }

  const removeDesiredRole = (roleToRemove: string) => {
    const current = form.getValues('desired_roles') || []
    form.setValue(
      'desired_roles',
      current.filter(role => role !== roleToRemove)
    )
  }

  const addDesiredIndustry = (industry: string) => {
    if (industry.trim() && !form.getValues('desired_industries')?.includes(industry.trim())) {
      const current = form.getValues('desired_industries') || []
      form.setValue('desired_industries', [...current, industry.trim()])
    }
  }

  const removeDesiredIndustry = (industryToRemove: string) => {
    const current = form.getValues('desired_industries') || []
    form.setValue(
      'desired_industries',
      current.filter(industry => industry !== industryToRemove)
    )
  }

  if (isLoading) {
    return (
      <Card className="glass-light rounded-glass shadow-glass-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card className="glass-light rounded-glass shadow-glass-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto mb-4 text-label-tertiary" />
            <h3 className="text-lg font-medium text-label-primary mb-2">No Profile Yet</h3>
            <p className="text-label-secondary mb-4">
              Create your profile to personalize your job hunt experience.
            </p>
            <Button onClick={() => setIsEditModalOpen(true)} className="btn-glass">
              <Edit className="mr-2 h-4 w-4" />
              Create Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="glass-light rounded-glass shadow-glass-subtle">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-label-primary">{profile.full_name}</h3>
            {user?.email && <p className="text-sm text-label-secondary">{user.email}</p>}
          </div>

          {/* Location */}
          {profile.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-label-tertiary" />
              <span className="text-label-secondary">{profile.location}</span>
            </div>
          )}

          {/* Current Role */}
          {profile.job_role && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-label-tertiary" />
              <span className="text-label-secondary">{profile.job_role}</span>
            </div>
          )}

          {/* Experience */}
          {profile.experience_years !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-label-tertiary" />
              <span className="text-label-secondary">
                {profile.experience_years} years of experience
              </span>
            </div>
          )}

          {/* Phone */}
          {profile.phone && (
            <div className="text-sm">
              <span className="text-label-tertiary">Phone:</span>
              <span className="ml-2 text-label-secondary">{profile.phone}</span>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3 pt-2">
            {profile.linkedin_url && (
              <Button variant="outline" size="sm" asChild className="text-xs">
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  LinkedIn
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
            {profile.portfolio_url && (
              <Button variant="outline" size="sm" asChild className="text-xs">
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  Portfolio
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>

          {/* Desired Roles */}
          {profile.desired_roles && profile.desired_roles.length > 0 && (
            <div className="pt-2">
              <h4 className="text-sm font-medium text-label-primary mb-2">Desired Roles</h4>
              <div className="flex flex-wrap gap-1">
                {profile.desired_roles.map((role, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Desired Industries */}
          {profile.desired_industries && profile.desired_industries.length > 0 && (
            <div className="pt-2">
              <h4 className="text-sm font-medium text-label-primary mb-2">Desired Industries</h4>
              <div className="flex flex-wrap gap-1">
                {profile.desired_industries.map((industry, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent variant="glass" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information to personalize your job hunt experience.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          value={field.value || ''}
                          onChange={field.onChange}
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
                          placeholder="+1 (555) 123-4567"
                          value={field.value || ''}
                          onChange={field.onChange}
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
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="San Francisco, CA"
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Current Role */}
                <FormField
                  control={form.control}
                  name="job_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Role</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Software Engineer"
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Experience Years */}
                <FormField
                  control={form.control}
                  name="experience_years"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5"
                          min="0"
                          max="100"
                          {...field}
                          onChange={e =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : null)
                          }
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* LinkedIn URL */}
                <FormField
                  control={form.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Portfolio URL */}
                <FormField
                  control={form.control}
                  name="portfolio_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portfolio URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://yourportfolio.com"
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Desired Roles */}
              <FormField
                control={form.control}
                name="desired_roles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Roles</FormLabel>
                    <FormDescription>Add roles you're interested in</FormDescription>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Frontend Developer"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addDesiredRole((e.target as HTMLInputElement).value)
                                ;(e.target as HTMLInputElement).value = ''
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.querySelector(
                                'input[placeholder="e.g., Frontend Developer"]'
                              ) as HTMLInputElement
                              if (input?.value) {
                                addDesiredRole(input.value)
                                input.value = ''
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {field.value?.map((role, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {role}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeDesiredRole(role)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Desired Industries */}
              <FormField
                control={form.control}
                name="desired_industries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Industries</FormLabel>
                    <FormDescription>Add industries you're interested in</FormDescription>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Technology"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addDesiredIndustry((e.target as HTMLInputElement).value)
                                ;(e.target as HTMLInputElement).value = ''
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.querySelector(
                                'input[placeholder="e.g., Technology"]'
                              ) as HTMLInputElement
                              if (input?.value) {
                                addDesiredIndustry(input.value)
                                input.value = ''
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {field.value?.map((industry, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              {industry}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeDesiredIndustry(industry)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
