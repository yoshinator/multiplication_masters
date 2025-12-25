import { createContext, useContext } from 'react'

export type ColorMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
  mode: ColorMode
  setMode: (mode: ColorMode) => void
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  setMode: () => {},
} as ThemeContextType)

export const useThemeContext = () => useContext(ThemeContext)
