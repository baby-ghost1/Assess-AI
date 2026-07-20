import { createSlice } from '@reduxjs/toolkit'

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  }
  return 'dark'
}

const initialState = { mode: getInitialTheme() }

function applyTheme(mode) {
  localStorage.setItem('theme', mode)
  if (mode === 'dark') document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => { state.mode = state.mode === 'dark' ? 'light' : 'dark'; applyTheme(state.mode) },
    setTheme: (state, action) => { state.mode = action.payload; applyTheme(state.mode) },
  },
})

export const { toggleTheme, setTheme } = themeSlice.actions
export default themeSlice.reducer
