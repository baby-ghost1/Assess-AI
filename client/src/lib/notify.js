import { toast } from 'sonner'

const TOAST_DURATION = 4000

export const notify = {
  success: (message, options = {}) =>
    toast.success(message, { duration: TOAST_DURATION, ...options }),

  error: (message, options = {}) =>
    toast.error(message, { duration: TOAST_DURATION, ...options }),

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
