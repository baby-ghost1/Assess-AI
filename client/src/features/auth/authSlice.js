import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

const initialState = { user: null, isAuthenticated: false, isLoading: false, error: null }

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('accessToken', data.data.accessToken)
    return data.data.user
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed')
  }
})

export const adminLogin = createAsyncThunk('auth/adminLogin', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/admin/login', credentials)
    localStorage.setItem('accessToken', data.data.accessToken)
    return data.data.user
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Admin login failed')
  }
})

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData)
    localStorage.setItem('accessToken', data.data.accessToken)
    return data.data.user
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed')
  }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout') } catch {}
  localStorage.removeItem('accessToken')
})

export const getCurrentUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me')
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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: { clearError: (state) => { state.error = null } },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => { s.isLoading = true; s.error = null })
      .addCase(login.fulfilled, (s, a) => { s.isLoading = false; s.isAuthenticated = true; s.user = a.payload })
      .addCase(login.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })
      .addCase(adminLogin.pending, (s) => { s.isLoading = true; s.error = null })
      .addCase(adminLogin.fulfilled, (s, a) => { s.isLoading = false; s.isAuthenticated = true; s.user = a.payload })
      .addCase(adminLogin.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })
      .addCase(register.pending, (s) => { s.isLoading = true; s.error = null })
      .addCase(register.fulfilled, (s, a) => { s.isLoading = false; s.isAuthenticated = true; s.user = a.payload })
      .addCase(register.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })
      .addCase(logout.fulfilled, (s) => { s.user = null; s.isAuthenticated = false })
      .addCase(getCurrentUser.pending, (s) => { s.isLoading = true })
      .addCase(getCurrentUser.fulfilled, (s, a) => { s.isLoading = false; s.isAuthenticated = true; s.user = a.payload })
      .addCase(getCurrentUser.rejected, (s) => { s.isLoading = false; s.isAuthenticated = false; s.user = null })
      .addCase(updateProfile.pending, (s) => { s.isLoading = true; s.error = null })
      .addCase(updateProfile.fulfilled, (s, a) => { s.isLoading = false; s.user = a.payload })
      .addCase(updateProfile.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })
      .addCase(deleteAccount.pending, (s) => { s.isLoading = true; s.error = null })
      .addCase(deleteAccount.fulfilled, (s) => { s.isLoading = false; s.user = null; s.isAuthenticated = false })
      .addCase(deleteAccount.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
