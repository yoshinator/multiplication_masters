import {
  AppBar,
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Login } from './Login'
import { useState } from 'react'

export const Header = () => {
  const [value, setValue] = useState(12)
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <AppBar position="fixed" color="transparent" elevation={0}>
      <Toolbar>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-around',
          }}
        >
          <FormControl>
            <FormLabel id="demo-controlled-radio-buttons-group">
              Tables
            </FormLabel>
            <RadioGroup
              aria-labelledby="demo-controlled-radio-buttons-group"
              name="controlled-radio-buttons-group"
              value={value}
              onChange={() => setValue((prev) => (prev === 12 ? 24 : 12))}
              row
            >
              <FormControlLabel value="12" control={<Radio />} label="12" />
              <FormControlLabel value="24" control={<Radio />} label="24" />
            </RadioGroup>
          </FormControl>
          <Login compact={compact} />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
