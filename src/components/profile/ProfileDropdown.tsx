'use client'

import * as React from 'react'
import { MapPin, Briefcase, Calendar, Edit, ExternalLink, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Input } from '@/components/ui/input'
import type { UserProfile } from '@/lib/types/database.types'
import type { ProfileFormData } from '@/lib/schemas/profile.schema'
import { getUserProfile, updateUserProfile } from '@/lib/api/profiles'
import { profileFormSchema } from '@/lib/schemas/profile.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

interface ProfileDropdownProps {
  userId: string
  user?: { email?: string | null }
}

export function ProfileDropdown({ userId, user }: ProfileDropdownProps) {
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const router = useRouter()

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

  const handleSignOut = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      // Client-side navigation to login after sign out
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback: try GET method
      window.location.href = '/auth/signout'
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
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  // Get display name or email
  const displayName = profile?.full_name || user?.email || 'User'
  const initials = displayName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-10 p-2 glass-light rounded-glass-sm hover:glass-heavy transition-all duration-300"
            style={{
              border: '1px solid var(--glass-border-subtle)',
              backdropFilter: 'blur(20px) saturate(180%)',
            }}
            aria-label="User profile menu"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
              {initials}
            </div>
            <ChevronDown className="h-3 w-3 text-label-tertiary flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 glass-light rounded-glass shadow-glass-medium"
          style={{
            border: '1px solid var(--glass-border-subtle)',
            backdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <DropdownMenuLabel
            className="glass-light rounded-glass-sm"
            style={{
              border: '1px solid var(--glass-border-subtle)',
              backdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-label-primary truncate">
                  {profile?.full_name || 'No Profile'}
                </div>
                <div className="text-xs text-label-secondary truncate">{user?.email}</div>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {profile && (
            <>
              {/* Location */}
              {profile.location && (
                <DropdownMenuItem
                  className="flex items-center gap-2 text-sm cursor-default"
                  disabled
                >
                  <MapPin className="h-4 w-4 text-label-tertiary" />
                  <span className="text-label-secondary">{profile.location}</span>
                </DropdownMenuItem>
              )}

              {/* Current Role */}
              {profile.job_role && (
                <DropdownMenuItem
                  className="flex items-center gap-2 text-sm cursor-default"
                  disabled
                >
                  <Briefcase className="h-4 w-4 text-label-tertiary" />
                  <span className="text-label-secondary">{profile.job_role}</span>
                </DropdownMenuItem>
              )}

              {/* Experience */}
              {profile.experience_years !== null && (
                <DropdownMenuItem
                  className="flex items-center gap-2 text-sm cursor-default"
                  disabled
                >
                  <Calendar className="h-4 w-4 text-label-tertiary" />
                  <span className="text-label-secondary">
                    {profile.experience_years} years experience
                  </span>
                </DropdownMenuItem>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-2 px-2 py-2">
                {profile.linkedin_url && (
                  <Button variant="outline" size="sm" asChild className="text-xs h-7">
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
                  <Button variant="outline" size="sm" asChild className="text-xs h-7">
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
                <div className="px-2 py-2">
                  <div className="text-xs font-medium text-label-primary mb-1">Desired Roles</div>
                  <div className="flex flex-wrap gap-1">
                    {profile.desired_roles.slice(0, 3).map((role, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                    {profile.desired_roles.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.desired_roles.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            onClick={() => setIsEditModalOpen(true)}
            className="cursor-pointer glass-interactive"
          >
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer text-red-600 focus:text-red-600 glass-interactive"
            aria-label="Sign out of your account"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
                              <button
                                type="button"
                                className="ml-1 hover:text-red-500"
                                onClick={() => removeDesiredRole(role)}
                              >
                                ×
                              </button>
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
                              <button
                                type="button"
                                className="ml-1 hover:text-red-500"
                                onClick={() => removeDesiredIndustry(industry)}
                              >
                                ×
                              </button>
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
