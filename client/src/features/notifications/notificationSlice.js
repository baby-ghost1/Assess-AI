import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/notifications')
    return data.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications')
  }
})

export const markAsRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/notifications/${id}/read`)
    return data.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to mark as read')
  }
})

export const markAllAsRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await api.patch('/notifications/read-all')
    return true
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read')
  }
})

export const deleteNotification = createAsyncThunk('notifications/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/notifications/${id}`)
    return id
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete notification')
  }
})

export const deleteAllNotifications = createAsyncThunk('notifications/deleteAll', async (_, { rejectWithValue }) => {
  try {
    await api.delete('/notifications')
    return true
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete all notifications')
  }
})

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0, total: 0, loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (s) => { s.loading = true })
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.loading = false
        s.items = a.payload.notifications
        s.unreadCount = a.payload.unreadCount
        s.total = a.payload.total
      })
      .addCase(fetchNotifications.rejected, (s) => { s.loading = false })
      .addCase(markAsRead.fulfilled, (s, a) => {
        const idx = s.items.findIndex((n) => n._id === a.payload._id)
        if (idx !== -1) { s.items[idx].read = true; s.unreadCount = Math.max(0, s.unreadCount - 1) }
      })
      .addCase(markAllAsRead.fulfilled, (s) => {
        s.items.forEach((n) => { n.read = true })
        s.unreadCount = 0
      })
      .addCase(deleteNotification.fulfilled, (s, a) => {
        const wasUnread = s.items.find((n) => n._id === a.payload && !n.read)
        s.items = s.items.filter((n) => n._id !== a.payload)
        if (wasUnread) s.unreadCount = Math.max(0, s.unreadCount - 1)
        s.total = Math.max(0, s.total - 1)
      })
      .addCase(deleteAllNotifications.fulfilled, (s) => {
        s.items = []
        s.unreadCount = 0
        s.total = 0
      })
  },
})

export default notificationSlice.reducer
