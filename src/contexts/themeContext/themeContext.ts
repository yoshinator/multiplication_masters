import { createContext, useContext } from 'react'

export type ColorMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
  mode: ColorMode
  setMode: (mode: ColorMode) => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
)

export function useThemeContext() {
  const ctx = useContext(ThemeContext)
  if (!ctx)
    throw new Error('useThemeContext() must be inside ThemeContextProvider')
  return ctx
}
