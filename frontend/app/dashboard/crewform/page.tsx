/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/purity */
'use client'

import React from 'react'
import { AlertCircle, CheckCircle, ArrowRight, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCrewForm } from '@/hooks/useCrewForm'
import { copyToClipboard } from '@/lib/api/crewApi'

type Step = 'form' | 'credentials'

// ... previous imports ...

export default function AddCrewForm() {
  const [step, setStep] = React.useState<Step>('form')
  const {
    formData,
    isSubmitting,
    error,
    credentials,
    handleChange,
    handleSubmit,
    resetForm
  } = useCrewForm()

  const handleFormSubmit = async (e: React.FormEvent) => {
    const success = await handleSubmit(e)
    if (success) {
      setStep('credentials')
    }
  }

  const handleResetAndAddAnother = () => {
    resetForm()
    setStep('form')
  }

  const handleComplete = () => {
    window.location.href = '/dashboard/crew'
  }

  if (step === 'credentials' && credentials) {
    return <CredentialsStep 
      firstName={formData.firstName}
      lastName={formData.lastName}
      credentials={credentials}
      onAddAnother={handleResetAndAddAnother}
      onComplete={handleComplete}
    />
  }

  return <FormStep 
    formData={formData}
    isSubmitting={isSubmitting}
    error={error}
    onChange={handleChange}
    onSubmit={handleFormSubmit}
  />
}

// Update FormStepProps interface
interface FormStepProps {
  formData: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    role: string
  }
  isSubmitting: boolean
  error: any
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onSubmit: (e: React.FormEvent) => void
}

const FormStep: React.FC<FormStepProps> = ({
  formData,
  isSubmitting,
  error,
  onChange,
  onSubmit
}) => {
  // Check authentication status on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        // You might want to redirect immediately or show a message
        console.warn('No authentication token found')
      }
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add Crew Member</h1>
        <p className="text-muted-foreground mt-2">
          Register a new driver, conductor, or supervisor account
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div>
              <p className="font-semibold text-red-500 mb-1">Error</p>
              <p className="text-muted-foreground">{error.message}</p>
            </div>
            
            {error.statusCode === 401 && (
              <div className="mt-3 pt-3 border-t border-red-500/20">
                <p className="text-sm text-red-500 mb-2">
                  You need to be logged in to add crew members.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/login'}
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Go to Login
                </Button>
              </div>
            )}
            
            {error.errors && (
              <ul className="mt-2 list-disc list-inside">
                {Object.entries(error.errors).map(([field, messages]) => (
                  <li key={field} className="text-sm text-red-500">
                    {field}: {(messages as string[]).join(', ')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Authentication Status Warning */}
      {typeof window !== 'undefined' && !localStorage.getItem('accessToken') && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-500 mb-1">Authentication Required</p>
            <p className="text-muted-foreground">
              You need to be logged in to add crew members. 
              Please login first or check if your session has expired.
            </p>
          </div>
        </div>
      )}

     



      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                First Name
              </label>
              <Input
                type="text"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={onChange}
                className="bg-secondary border-border"
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Last Name
              </label>
              <Input
                type="text"
                name="lastName"
                placeholder="Smith"
                value={formData.lastName}
                onChange={onChange}
                className="bg-secondary border-border"
                required
                minLength={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <Input
              type="email"
              name="email"
              placeholder="john.smith@example.com"
              value={formData.email}
              onChange={onChange}
              className="bg-secondary border-border"
              required
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
            <Input
              type="tel"
              name="phoneNumber"
              placeholder="+1 (555) 123-4567"
              value={formData.phoneNumber}
              onChange={onChange}
              className="bg-secondary border-border"
              required
            />
          </div>
        </div>

        {/* Job Information */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Job Information</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={onChange}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
              required
            >
              <option value="driver">Driver</option>
              <option value="conductor">Conductor</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 gap-2 font-medium"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              Create Crew Member
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

// Credentials Step Component
interface CredentialsStepProps {
  firstName: string
  lastName: string
  credentials: {
    employeeId: string
    email: string
    temporaryPassword: string
  }
  onAddAnother: () => void
  onComplete: () => void
}

const CredentialsStep: React.FC<CredentialsStepProps> = ({
  firstName,
  lastName,
  credentials,
  onAddAnother,
  onComplete
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Banner */}
      <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-4">
        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-green-500">Crew Member Added Successfully</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {firstName} {lastName} has been registered in the system.
          </p>
        </div>
      </div>

      {/* Credentials Card */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Temporary Credentials</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Share these credentials with the crew member. They will be prompted to change
            password on first login.
          </p>
        </div>

        {/* Credentials Display */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Employee ID
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-foreground font-mono">{credentials.employeeId}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(credentials.employeeId)}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Email
            </p>
            <div className="flex items-center justify-between">
              <p className="text-lg text-foreground font-mono">{credentials.email}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(credentials.email)}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Temporary Password
            </p>
            <div className="flex items-center justify-between">
              <p className="text-lg text-foreground font-mono">{credentials.temporaryPassword}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(credentials.temporaryPassword)}
              >
                Copy
              </Button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-500 mb-1">Important</p>
            <p className="text-muted-foreground">
              Share credentials securely. Login link is valid for 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="flex-1 bg-transparent"
          onClick={onAddAnother}
        >
          Add Another Member
        </Button>
        <Button 
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={onComplete}
        >
          Complete
        </Button>
      </div>
    </div>
  )
}