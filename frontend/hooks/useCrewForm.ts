import { useState, useCallback } from 'react'
import { 
  CreateCrewRequest, 
  Credentials, 
  CreateCrewResponse,
  extractCredentialsFromResponse,
  ApiError 
} from '@/types/crew'
import { CrewApiService, getSaccoId } from '@/lib/api/crewApi'

interface UseCrewFormReturn {
  formData: CreateCrewRequest
  isSubmitting: boolean
  error: ApiError | null
  credentials: Credentials | null
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  handleSubmit: (e: React.FormEvent) => Promise<boolean>
  resetForm: () => void
  clearError: () => void
}

export const useCrewForm = (initialRole = 'driver'): UseCrewFormReturn => {
  const [formData, setFormData] = useState<CreateCrewRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: initialRole,
    saccoId: getSaccoId(),
    sendCredentials: true
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [credentials, setCredentials] = useState<Credentials | null>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (error) setError(null)
  }, [error])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setCredentials(null)

    // Check authentication
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setError({
          message: 'You are not authenticated. Please login again.',
          statusCode: 401
        })
        setIsSubmitting(false)
        
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
        
        return false
      }
    }

    try {
      // Ensure saccoId is set
      const dataToSubmit = {
        ...formData,
        saccoId: getSaccoId(),
        sendCredentials: true
      }

      console.log('Submitting data:', dataToSubmit)

      const response = await CrewApiService.createCrewMember(dataToSubmit)
      console.log('API Response:', response)

      // Extract credentials using the helper function
      const extractedCredentials = extractCredentialsFromResponse(response, formData.email)
      
      console.log('Extracted credentials:', extractedCredentials)
      setCredentials(extractedCredentials)
      return true
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError)
      console.error('Error creating crew member:', apiError)
      
      if (apiError.statusCode === 401) {
        setTimeout(() => {
          window.location.href = '/login?redirect=/dashboard/crew/add'
        }, 3000)
      }
      
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [formData])

  const resetForm = useCallback(() => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: initialRole,
      saccoId: getSaccoId(),
      sendCredentials: true
    })
    setError(null)
    setCredentials(null)
  }, [initialRole])

  return {
    formData,
    isSubmitting,
    error,
    credentials,
    handleChange,
    handleSubmit,
    resetForm,
    clearError
  }
}