import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'
import { notify } from '@/lib/notify'

const initialState = { user: null, isAuthenticated: false, isLoading: false, error: null, deletedAccount: null }

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('accessToken', data.data.accessToken)
    if (data.data.user?._id) localStorage.setItem('assessai_active_uid', data.data.user._id)
    if (data.data.restored) {
      notify.success('Welcome back! Your account was restored and all of your data is intact.')
    }
    return data.data.user
  } catch (error) {
    const body = error.response?.data
    return rejectWithValue({
      message: body?.message || 'Login failed',
      deletedAccount: body?.errors?.code === 'ACCOUNT_DELETED' ? body.errors : null,
    })
  }
})

export const adminLogin = createAsyncThunk('auth/adminLogin', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/admin/login', credentials)
    localStorage.setItem('accessToken', data.data.accessToken)
    if (data.data.user?._id) localStorage.setItem('assessai_active_uid', data.data.user._id)
    return data.data.user
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Admin login failed')
  }
})

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData)
    if (data.data.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken)
    }
    if (data.data.user?._id) localStorage.setItem('assessai_active_uid', data.data.user._id)
    return data.data.user
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed')
  }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout') } catch {}
  localStorage.removeItem('accessToken')
  localStorage.removeItem('assessai_active_uid')
})

export const getCurrentUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me')
    if (data.data?._id) localStorage.setItem('assessai_active_uid', data.data._id)
    return data.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch user')
  }
})

export const changePassword = createAsyncThunk('auth/changePassword', async ({ oldPassword, newPassword }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/change-password', { oldPassword, newPassword, confirmPassword: newPassword })
    return data.message
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to change password')
  }
})

export const updateProfile = createAsyncThunk('auth/updateProfile', async (updates, { rejectWithValue }) => {
  try {
    const { data } = await api.patch('/auth/profile', updates)
    return data.data.user
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update profile')
  }
})

export const deleteAccount = createAsyncThunk('auth/deleteAccount', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.delete('/auth/account', { data: payload })
    return data.message
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete account')
  }
})

export const sendDeleteOtp = createAsyncThunk('auth/sendDeleteOtp', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/send-delete-otp')
    return data.message
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to send OTP')
  }
})

export const sendPasswordOtp = createAsyncThunk('auth/sendPasswordOtp', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/send-password-otp')
    return data.message
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to send OTP')
  }
})

export const verifyPasswordOtp = createAsyncThunk('auth/verifyPasswordOtp', async ({ otp, newPassword }, { rejectWithValue }) => {
  try {
    const payload = newPassword ? { otp, newPassword, confirmPassword: newPassword } : { otp }
    const { data } = await api.post('/auth/verify-password-otp', payload)
    return data.message
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to set password')
  }
})

export const verifyDeleteOtp = createAsyncThunk('auth/verifyDeleteOtp', async (otp, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/verify-delete-otp', { otp })
    return data.message
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to verify OTP')
  }
})

export const oauthCallback = createAsyncThunk('auth/oauthCallback', async (_, { dispatch, rejectWithValue }) => {
  try {
    const result = await dispatch(getCurrentUser()).unwrap()
    return result
  } catch (error) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('assessai_active_uid')
    return rejectWithValue(error || 'OAuth authentication failed')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; state.deletedAccount = null },
    clearSession: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
      state.error = null
      state.deletedAccount = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => { s.isLoading = true; s.error = null; s.deletedAccount = null })
      .addCase(login.fulfilled, (s, a) => { s.isLoading = false; s.isAuthenticated = true; s.user = a.payload })
      .addCase(login.rejected, (s, a) => {
        s.isLoading = false
        const payload = a.payload
        s.error = typeof payload === 'string' ? payload : payload?.message || 'Login failed'
        s.deletedAccount = (payload && typeof payload === 'object' && payload.deletedAccount) || null
      })
      .addCase(adminLogin.pending, (s) => { s.isLoading = true; s.error = null })
      .addCase(adminLogin.fulfilled, (s, a) => { s.isLoading = false; s.isAuthenticated = true; s.user = a.payload })
      .addCase(adminLogin.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })
      .addCase(register.pending, (s) => { s.isLoading = true; s.error = null })
      .addCase(register.fulfilled, (s, a) => {
        s.isLoading = false
        s.isAuthenticated = a.payload?.isApproved === true
        s.user = a.payload
      })
      .addCase(register.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })
      .addCase(logout.fulfilled, (s) => { s.user = null; s.isAuthenticated = false })
      .addCase(getCurrentUser.pending, (s) => { s.isLoading = true })
      .addCase(getCurrentUser.fulfilled, (s, a) => { s.isLoading = false; s.isAuthenticated = true; s.user = a.payload })
      .addCase(getCurrentUser.rejected, (s) => { s.isLoading = false; s.isAuthenticated = false; s.user = null })
      // Profile save must NOT flip global isLoading — DashboardLayout unmounts the page mid-save
      .addCase(updateProfile.pending, (s) => { s.error = null })
      .addCase(updateProfile.fulfilled, (s, a) => { s.user = a.payload })
      .addCase(updateProfile.rejected, (s, a) => { s.error = a.payload })
      .addCase(deleteAccount.pending, (s) => { s.isLoading = true; s.error = null })
      .addCase(deleteAccount.fulfilled, (s) => { s.isLoading = false; s.user = null; s.isAuthenticated = false })
      .addCase(deleteAccount.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })
  },
})

export const { clearError, clearSession } = authSlice.actions
export default authSlice.reducer
