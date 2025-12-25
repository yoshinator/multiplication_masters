import { useState, useMemo, type ReactNode } from 'react'
import { ThemeContext, type ColorMode } from './themeContext'
import { ThemeProvider, useMediaQuery, CssBaseline } from '@mui/material'
import { theme, darkTheme } from '../../theme/theme'

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
  // You can initialize this from localStorage to persist the user's choice
  const [mode, setMode] = useState<ColorMode>('system')

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
