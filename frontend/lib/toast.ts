// Simple toast utility
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // You can integrate with your preferred toast library
  // For example: toast.success(message) if using react-hot-toast
  console.log(`${type}: ${message}`)
  
  // Simple browser notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(message)
  }
}