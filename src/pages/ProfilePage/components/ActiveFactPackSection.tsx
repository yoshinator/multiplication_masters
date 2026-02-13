import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Typography,
} from '@mui/material'
import type { FC } from 'react'
import type { PackKey } from '../../../constants/dataModels'
import ProfileSectionCard from './ProfileSectionCard'
import { PACK_LABELS } from './profileConstants'

type ActiveFactPackSectionProps = {
  activePack: PackKey | ''
  enabledPacks: PackKey[]
  onPackChange: (event: SelectChangeEvent<PackKey | ''>) => void
}

const ActiveFactPackSection: FC<ActiveFactPackSectionProps> = ({
  activePack,
  enabledPacks,
  onPackChange,
}) => {
  return (
    <ProfileSectionCard
      sx={{
        borderColor: 'primary.main',
        bgcolor: 'background.default',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Active Fact Pack
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This controls which fact family appears in practice sessions.
      </Typography>

      <Box sx={{ maxWidth: 460 }}>
        <FormControl fullWidth size="medium">
          <InputLabel id="active-pack-label">Select Fact Pack</InputLabel>
          <Select<PackKey | ''>
            label="Select Fact Pack"
            labelId="active-pack-label"
            onChange={onPackChange}
            value={activePack}
          >
            {enabledPacks.map((packId) => {
              return (
                <MenuItem key={packId} value={packId}>
                  {PACK_LABELS[packId] || packId}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>
      </Box>
    </ProfileSectionCard>
  )
}

export default ActiveFactPackSection
