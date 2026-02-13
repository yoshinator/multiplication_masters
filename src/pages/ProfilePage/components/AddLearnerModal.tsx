import { useState, type FC } from 'react'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import AppModal from '../../../components/AppModal/AppModal'
import { useCloudFunction } from '../../../hooks/useCloudFunction'
import { useNotification } from '../../../contexts/notificationContext/notificationContext'
import { useUser } from '../../../contexts/userContext/useUserContext'
import { extractErrorMessage } from '../../../utilities/typeutils'
import { PROFILE_GRADE_OPTIONS } from './profileConstants'

type AddLearnerModalProps = {
  onClose: () => void
}

const AddLearnerModal: FC<AddLearnerModalProps> = ({ onClose }) => {
  const { setActiveProfileId } = useUser()
  const { showNotification } = useNotification()
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileGrade, setNewProfileGrade] = useState('')

  const { execute: createProfileFn, isPending: isCreatingProfile } =
    useCloudFunction<
      { displayName: string; gradeLevel: number | null },
      { profileId: string; loginName: string; displayName: string }
    >('createProfile')

  const canCreateProfile =
    newProfileName.trim().length > 0 && !isCreatingProfile

  const handleCreateProfile = async () => {
    if (!canCreateProfile) return
    const gradeLevel = newProfileGrade
      ? Number.parseInt(newProfileGrade, 10)
      : null

    try {
      const result = await createProfileFn({
        displayName: newProfileName.trim(),
        gradeLevel,
      })
      const profileId = result?.data?.profileId
      if (profileId) {
        await setActiveProfileId(profileId)
      }
      onClose()
    } catch (error: unknown) {
      showNotification(extractErrorMessage(error), 'error')
    }
  }

  return (
    <AppModal open onClose={onClose} title="Add learner" maxWidth="xs">
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          Create a learner profile for this account.
        </Typography>
        <TextField
          label="Display name"
          value={newProfileName}
          onChange={(event) => setNewProfileName(event.target.value)}
          placeholder="e.g., Mia"
          size="small"
          autoFocus
        />
        <FormControl size="small">
          <InputLabel id="new-profile-grade-label">Grade</InputLabel>
          <Select
            labelId="new-profile-grade-label"
            label="Grade"
            value={newProfileGrade}
            onChange={(event: SelectChangeEvent<string>) => {
              setNewProfileGrade(event.target.value)
            }}
          >
            <MenuItem value="">Not set</MenuItem>
            {PROFILE_GRADE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={String(option.value)}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={handleCreateProfile}
          disabled={!canCreateProfile}
        >
          {isCreatingProfile ? 'Creating...' : 'Create profile'}
        </Button>
        <Typography variant="caption" color="text.secondary">
          Sign-in names are generated from the display name and must be unique.
        </Typography>
      </Stack>
    </AppModal>
  )
}

export default AddLearnerModal
