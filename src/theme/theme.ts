// theme.ts
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2962ff', // clean bright blue
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
      default: '#f5f7fb',
      paper: '#ffffff',
    },
  },
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
})
