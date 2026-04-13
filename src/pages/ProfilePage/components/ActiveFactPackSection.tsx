import {
  Box,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Typography,
} from '@mui/material'
import type { FC } from 'react'
import { FREE_PACKS } from '../../../constants/appConstants'
import type { PackKey } from '../../../constants/dataModels'
import ProfileSectionCard from './ProfileSectionCard'
import { PACK_LABELS } from './profileConstants'

type ActiveFactPackSectionProps = {
  activePack: PackKey | ''
  selectablePacks: PackKey[]
  isPremium: boolean
  onPackChange: (event: SelectChangeEvent<PackKey | ''>) => void
  onUpgradeClick: () => void
}

const PACK_LEARNING_ORDER: PackKey[] = [
  'add_20',
  'sub_20',
  'mul_36',
  'mul_144',
  'div_144',
  'mul_div_144',
  'mul_576',
]

const getPackSortValue = (packId: PackKey) => {
  const index = PACK_LEARNING_ORDER.indexOf(packId)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

const ActiveFactPackSection: FC<ActiveFactPackSectionProps> = ({
  activePack,
  selectablePacks,
  isPremium,
  onPackChange,
  onUpgradeClick,
}) => {
  const orderedPacks = [...selectablePacks].sort(
    (a, b) => getPackSortValue(a) - getPackSortValue(b)
  )

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
            {orderedPacks.map((packId) => {
              const isPremiumPack = !FREE_PACKS.includes(packId)
              return (
                <MenuItem key={packId} value={packId}>
                  {PACK_LABELS[packId] || packId}
                  {!isPremium && isPremiumPack ? ' *' : ''}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>
        {!isPremium && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            *{' '}
            <Link
              component="button"
              type="button"
              onClick={onUpgradeClick}
              underline="hover"
            >
              Upgrade to premium
            </Link>
          </Typography>
        )}
      </Box>
    </ProfileSectionCard>
  )
}

export default ActiveFactPackSection
