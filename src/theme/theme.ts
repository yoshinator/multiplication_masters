import { createTheme, type ThemeOptions } from '@mui/material/styles'
import {
  amber,
  deepPurple,
  green,
  orange,
  pink,
  red,
} from '@mui/material/colors'

const baseThemeOptions: ThemeOptions = {
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: `'Inter', 'Roboto', sans-serif`,
    h2: {
      fontWeight: 800,
      letterSpacing: '-0.5px',
      fontSize: '3rem',
    },
    h5: {
      opacity: 0.7,
    },
    button: {
      textTransform: 'none', // More friendly/playful
      fontWeight: 700,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow:
            '0px 8px 28px rgba(0,0,0,0.08), 0px 2px 8px rgba(0,0,0,0.04)',
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& input[type=number]': {
            MozAppearance: 'textfield',
          },
          '& input[type=number]::-webkit-outer-spin-button': {
            WebkitAppearance: 'none',
            margin: 0,
          },
          '& input[type=number]::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
            margin: 0,
          },
        },
      },
    },
  },
}

export const theme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: deepPurple['A200'], // Playful purple
    },
    secondary: {
      main: pink['A200'], // Pink accent
    },
    success: {
      main: green['A700'],
    },
    warning: {
      main: amber['A700'],
      light: amber['A200'],
    },
    error: {
      main: red['A700'],
    },
    background: {
      default: '#f4f1fa', // Light purple tint
      paper: '#ffffff',
    },
  },
})

export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: deepPurple['A100'], // Lighter purple for dark mode
    },
    secondary: {
      main: pink['A100'],
    },
    success: {
      main: green[400], // Green 400 - Good contrast on dark
    },
    warning: {
      main: orange[400], // Orange 400
    },
    error: {
      main: red[500], // Red 500
    },
    background: {
      default: '#120e26', // Deep purple dark
      paper: '#1d1933',
    },
  },
})
