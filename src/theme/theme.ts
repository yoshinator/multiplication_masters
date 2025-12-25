import { createTheme, type ThemeOptions } from '@mui/material/styles'

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
      main: '#7c4dff', // Playful purple
    },
    secondary: {
      main: '#ff4081', // Pink accent
    },
    success: {
      main: '#00c853',
    },
    warning: {
      main: '#ffab00',
      light: '#ffd740',
    },
    error: {
      main: '#d50000',
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
      main: '#b388ff', // Lighter purple for dark mode
    },
    secondary: {
      main: '#ff80ab',
    },
    background: {
      default: '#120e26', // Deep purple dark
      paper: '#1d1933',
    },
  },
})
