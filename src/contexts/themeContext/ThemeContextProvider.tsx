import { useState, useMemo, type ReactNode, useEffect } from 'react'
import { ThemeContext, type ColorMode } from './themeContext'
import { ThemeProvider, useMediaQuery, CssBaseline } from '@mui/material'
import { theme, darkTheme } from '../../theme/theme'

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
  const storedMode = localStorage.getItem('mode')
  const initialMode: ColorMode =
    storedMode === 'light' || storedMode === 'dark' || storedMode === 'system'
      ? storedMode
      : 'system'
  const [mode, setMode] = useState<ColorMode>(initialMode)

  useEffect(() => {
    localStorage.setItem('mode', mode)
  }, [mode])

  // This hook listens to the system/OS preference
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  const activeTheme = useMemo(() => {
    if (mode === 'system') {
      return systemPrefersDark ? darkTheme : theme
    }
    return mode === 'dark' ? darkTheme : theme
  }, [mode, systemPrefersDark])

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <ThemeProvider theme={activeTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}
