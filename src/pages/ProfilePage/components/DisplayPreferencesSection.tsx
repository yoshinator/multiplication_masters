import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  Typography,
} from '@mui/material'
import type { ChangeEvent, FC } from 'react'
import ProfileSectionCard from './ProfileSectionCard'

type DisplayPreferencesSectionProps = {
  mode: 'light' | 'dark' | 'system'
  showTour: boolean
  onThemeChange: (event: ChangeEvent<HTMLInputElement>) => void
  onShowTourChange: (event: ChangeEvent<HTMLInputElement>) => void
}

const DisplayPreferencesSection: FC<DisplayPreferencesSectionProps> = ({
  mode,
  showTour,
  onThemeChange,
  onShowTourChange,
}) => {
  return (
    <ProfileSectionCard>
      <Typography id="appearance-label" variant="subtitle2" sx={{ mb: 1 }}>
        Appearance
      </Typography>
      <FormControl sx={{ mb: 3 }}>
        <RadioGroup
          row
          aria-labelledby="appearance-label"
          name="theme-preference"
          value={mode}
          onChange={onThemeChange}
        >
          <FormControlLabel value="light" control={<Radio />} label="Light" />
          <FormControlLabel value="dark" control={<Radio />} label="Dark" />
          <FormControlLabel value="system" control={<Radio />} label="System" />
        </RadioGroup>
      </FormControl>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Guided Tour
      </Typography>
      <FormControlLabel
        control={<Switch checked={showTour} onChange={onShowTourChange} />}
        label="Show the tour next time I visit Practice"
      />
    </ProfileSectionCard>
  )
}

export default DisplayPreferencesSection
