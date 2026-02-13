import type { BoxProps } from '@mui/material'

export const PROFILE_OPTION_GRID_STYLE: BoxProps['sx'] = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(2, 1fr)',
    md: 'repeat(4, minmax(0, 1fr))',
  },
  alignItems: 'stretch',
  gap: 1.25,
}

export const getProfileOptionButtonStyle = (
  selected: boolean
): BoxProps['sx'] => ({
  all: 'unset',
  boxSizing: 'border-box',
  width: '100%',
  maxWidth: '100%',
  px: 1.5,
  py: 1.75,
  borderRadius: 2,
  border: '1px solid',
  borderColor: selected ? 'primary.main' : 'divider',
  cursor: 'pointer',
  bgcolor: selected ? 'primary.light' : 'background.paper',
  color: selected ? 'primary.contrastText' : 'inherit',
  transition: 'all 0.2s ease',
  fontWeight: 600,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 0,
  minHeight: 88,
  height: 'auto',

  '&:hover': {
    borderColor: selected ? 'primary.main' : 'text.primary',
    transform: 'translateY(-1px)',
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
})
