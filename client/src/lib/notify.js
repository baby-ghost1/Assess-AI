import { toast } from 'sonner'

const TOAST_DURATION = 4000

export function openAlert({ title, message, variant = 'danger' } = {}) {
  window.dispatchEvent(new CustomEvent('app:alert', { detail: { title, message, variant } }))
}

export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response) {
    return error.response.data?.message || fallback
  }
  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. Your connection seems slow — please try again.'
  }
  if (error?.code === 'ERR_NETWORK' || error?.request) {
    return "Can't reach the server. Check your internet connection and try again."
  }
  return fallback
}

export const notify = {
  success: (message, options = {}) =>
    toast.success(message, { duration: TOAST_DURATION, ...options }),

  error: (message, options = {}) => {
    const { toast: asToast, title, ...rest } = options
    if (asToast) return toast.error(message, { duration: TOAST_DURATION, ...rest })
    return openAlert({ title, message })
  },

  warning: (message, options = {}) =>
    toast.warning(message, { duration: TOAST_DURATION, ...options }),

  info: (message, options = {}) =>
    toast.info(message, { duration: TOAST_DURATION, ...options }),

  loading: (message, options = {}) =>
    toast.loading(message, { ...options }),

  promise: (promise, msgs, options = {}) =>
    toast.promise(promise, msgs, { duration: TOAST_DURATION, ...options }),

  dismiss: (id) => toast.dismiss(id),

  custom: (fn, options = {}) => toast(fn, { duration: TOAST_DURATION, ...options }),
}
