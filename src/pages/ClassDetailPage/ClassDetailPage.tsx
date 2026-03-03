import { useEffect, useMemo, useState, type FC } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Add, ArrowBack, DeleteOutline, Edit } from '@mui/icons-material'
import {
  collection,
  deleteDoc,
  doc,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { useNavigate, useParams } from 'react-router-dom'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useFirestoreDoc, useFirestoreQuery } from '../../hooks/useFirestore'
import type {
  Classroom,
  ClassroomRosterEntry,
  GradeLevel,
  PackKey,
  UserProfile,
} from '../../constants/dataModels'
import { ROUTES } from '../../constants/routeConstants'
import { PACK_LABELS } from '../ProfilePage/components/profileConstants'
import { useNotification } from '../../contexts/notificationContext/notificationContext'
import { useCloudFunction } from '../../hooks/useCloudFunction'

const ALL_PACKS: PackKey[] = [
  'add_20',
  'sub_20',
  'mul_36',
  'mul_144',
  'mul_576',
  'div_144',
]

const CLASS_GRADE_OPTIONS: Array<{ value: GradeLevel; label: string }> = [
  { value: 'K', label: 'K' },
  { value: '1', label: '1st' },
  { value: '2', label: '2nd' },
  { value: '3', label: '3rd' },
  { value: '4', label: '4th' },
  { value: '5', label: '5th' },
  { value: '6', label: '6th' },
  { value: '7', label: '7th' },
  { value: '8', label: '8th' },
  { value: '9+', label: '9+' },
]

const formatClassGrade = (grade: GradeLevel) => {
  return (
    CLASS_GRADE_OPTIONS.find((option) => option.value === grade)?.label ??
    grade
  )
}

const normalizePackSettings = (
  enabledPacks: PackKey[] | undefined,
  activePack: PackKey | undefined
): { enabledPacks: PackKey[]; activePack: PackKey } => {
  const unique = Array.from(new Set<PackKey>(enabledPacks ?? []))
  const ordered = ALL_PACKS.filter((pack) => unique.includes(pack))
  const nextEnabled: PackKey[] =
    ordered.length > 0 ? ordered : ['mul_36']
  const candidate: PackKey = activePack ?? 'mul_36'
  const nextActive = nextEnabled.includes(candidate)
    ? candidate
    : nextEnabled[0]
  return { enabledPacks: nextEnabled, activePack: nextActive }
}

type PackSettingsDialogProps = {
  open: boolean
  title: string
  enabledPacks: PackKey[]
  activePack: PackKey
  onClose: () => void
  onSave: (nextEnabled: PackKey[], nextActive: PackKey) => void
}

const PackSettingsDialog: FC<PackSettingsDialogProps> = ({
  open,
  title,
  enabledPacks,
  activePack,
  onClose,
  onSave,
}) => {
  const [localEnabled, setLocalEnabled] = useState<PackKey[]>(enabledPacks)
  const [localActive, setLocalActive] = useState<PackKey>(activePack)

  useEffect(() => {
    setLocalEnabled(enabledPacks)
    setLocalActive(activePack)
  }, [enabledPacks, activePack])

  const handleSave = () => {
    const normalized = normalizePackSettings(localEnabled, localActive)
    onSave(normalized.enabledPacks, normalized.activePack)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <FormControl>
            <InputLabel id="enabled-pack-label">Enabled packs</InputLabel>
            <Select
              labelId="enabled-pack-label"
              label="Enabled packs"
              multiple
              value={localEnabled}
              onChange={(event) =>
                setLocalEnabled(event.target.value as PackKey[])
              }
              renderValue={(selected) =>
                (selected as PackKey[])
                  .map((pack) => PACK_LABELS[pack] ?? pack)
                  .join(', ')
              }
            >
              {ALL_PACKS.map((pack) => (
                <MenuItem key={pack} value={pack}>
                  {PACK_LABELS[pack] ?? pack}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel id="active-pack-label">Active pack</InputLabel>
            <Select
              labelId="active-pack-label"
              label="Active pack"
              value={localActive}
              onChange={(event) =>
                setLocalActive(event.target.value as PackKey)
              }
            >
              {(localEnabled.length > 0 ? localEnabled : ALL_PACKS).map(
                (pack) => (
                  <MenuItem key={pack} value={pack}>
                    {PACK_LABELS[pack] ?? pack}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save packs
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const ClassDetailPage: FC = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { db } = useFirebaseContext()
  const { user } = useUser()
  const { showNotification } = useNotification()
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ClassroomRosterEntry | null>(
    null
  )

  const { execute: applyPackDefaults, isPending: isApplyPending } =
    useCloudFunction<
      {
        classId: string
        defaultEnabledPacks: PackKey[]
        defaultActivePack: PackKey
      },
      { updated: number }
    >('applyClassroomPackDefaults')

  const classRef = useMemo(() => {
    if (!db || !user?.uid || !classId) return null
    return doc(db, 'users', user.uid, 'classrooms', classId)
  }, [db, user?.uid, classId])

  const { data: classroom, exists: classExists, loading: classLoading } =
    useFirestoreDoc<Classroom>(classRef)

  const rosterQuery = useMemo(() => {
    if (!db || !user?.uid || !classId) return null
    return query(
      collection(db, 'users', user.uid, 'classrooms', classId, 'roster'),
      orderBy('displayName', 'asc')
    )
  }, [db, user?.uid, classId])

  const { data: roster, loading: rosterLoading } =
    useFirestoreQuery<ClassroomRosterEntry>(rosterQuery)

  const profilesQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, 'users', user.uid, 'profiles'))
  }, [db, user?.uid])

  const { data: profiles } = useFirestoreQuery<UserProfile>(profilesQuery)

  const [draftEdit, setDraftEdit] = useState({
    name: '',
    schoolYear: '',
    grade: '3' as GradeLevel,
    subject: '',
    section: '',
    room: '',
  })

  useEffect(() => {
    if (!classroom) return
    setDraftEdit({
      name: classroom.name,
      schoolYear: classroom.schoolYear,
      grade: classroom.grade,
      subject: classroom.subject ?? '',
      section: classroom.section ?? '',
      room: classroom.room ?? '',
    })
  }, [classroom])

  const classDefaults = normalizePackSettings(
    classroom?.defaultEnabledPacks ?? ['mul_36'],
    classroom?.defaultActivePack ?? 'mul_36'
  )

  const handleUpdateClassDetails = async () => {
    if (!db || !user?.uid || !classId) return
    if (!draftEdit.name.trim() || !draftEdit.schoolYear.trim()) {
      showNotification('Class name and school year are required.', 'warning')
      return
    }

    try {
      await updateDoc(doc(db, 'users', user.uid, 'classrooms', classId), {
        name: draftEdit.name.trim(),
        schoolYear: draftEdit.schoolYear.trim(),
        grade: draftEdit.grade,
        subject: draftEdit.subject.trim() || null,
        section: draftEdit.section.trim() || null,
        room: draftEdit.room.trim() || null,
        updatedAt: serverTimestamp(),
      })
      showNotification('Class details updated.', 'success')
      setIsEditDialogOpen(false)
    } catch {
      showNotification('Unable to update class details.', 'error')
    }
  }

  const handleSaveClassPacks = async (nextEnabled: PackKey[], nextActive: PackKey) => {
    if (!db || !user?.uid || !classId) return
    try {
      await updateDoc(doc(db, 'users', user.uid, 'classrooms', classId), {
        defaultEnabledPacks: nextEnabled,
        defaultActivePack: nextActive,
        updatedAt: serverTimestamp(),
      })
      showNotification('Default packs updated.', 'success')
      setEditingProfile(null)
    } catch {
      showNotification('Unable to update default packs.', 'error')
    }
  }

  const handleApplyDefaultsToRoster = async () => {
    if (!classId) return
    try {
      const result = await applyPackDefaults({
        classId,
        defaultEnabledPacks: classDefaults.enabledPacks,
        defaultActivePack: classDefaults.activePack,
      })
      showNotification(
        `Applied pack defaults to ${result?.data.updated ?? 0} learners.`,
        'success'
      )
    } catch {
      showNotification('Unable to apply pack defaults.', 'error')
    }
  }

  const availableProfiles = profiles.filter(
    (profile) => !roster.some((entry) => entry.profileId === profile.id)
  )

  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])

  const handleAddProfiles = async () => {
    if (!db || !user?.uid || !classId) return
    if (selectedProfiles.length === 0) return

    const batch = writeBatch(db)
    selectedProfiles.forEach((profileId) => {
      const profile = profiles.find((item) => item.id === profileId)
      if (!profile) return

      const rosterRef = doc(
        db,
        'users',
        user.uid,
        'classrooms',
        classId,
        'roster',
        profileId
      )

      const normalized = normalizePackSettings(
        profile.enabledPacks ?? classDefaults.enabledPacks,
        (profile.activePack ?? classDefaults.activePack) as PackKey
      )

      batch.set(rosterRef, {
        profileId,
        displayName: profile.displayName,
        loginName: profile.loginName,
        gradeLevel: profile.gradeLevel ?? null,
        enabledPacks: normalized.enabledPacks,
        activePack: normalized.activePack,
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        addedBy: user.uid,
      })
    })

    const classDocRef = doc(db, 'users', user.uid, 'classrooms', classId)
    batch.update(classDocRef, {
      rosterCount: increment(selectedProfiles.length),
      updatedAt: serverTimestamp(),
    })

    try {
      await batch.commit()
      showNotification('Learners added to class.', 'success')
      setSelectedProfiles([])
      setIsRosterDialogOpen(false)
    } catch {
      showNotification('Unable to add learners.', 'error')
    }
  }

  const handleRemoveProfile = async (entry: ClassroomRosterEntry) => {
    if (!db || !user?.uid || !classId) return

    try {
      await deleteDoc(
        doc(
          db,
          'users',
          user.uid,
          'classrooms',
          classId,
          'roster',
          entry.profileId
        )
      )
      await updateDoc(doc(db, 'users', user.uid, 'classrooms', classId), {
        rosterCount: increment(-1),
        updatedAt: serverTimestamp(),
      })
      showNotification('Learner removed.', 'success')
    } catch {
      showNotification('Unable to remove learner.', 'error')
    }
  }

  const handleSaveProfilePacks = async (
    entry: ClassroomRosterEntry,
    nextEnabled: PackKey[],
    nextActive: PackKey
  ) => {
    if (!db || !user?.uid || !classId) return
    const batch = writeBatch(db)

    const rosterRef = doc(
      db,
      'users',
      user.uid,
      'classrooms',
      classId,
      'roster',
      entry.profileId
    )
    batch.set(
      rosterRef,
      {
        enabledPacks: nextEnabled,
        activePack: nextActive,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    const profileRef = doc(
      db,
      'users',
      user.uid,
      'profiles',
      entry.profileId
    )
    batch.set(
      profileRef,
      {
        enabledPacks: nextEnabled,
        activePack: nextActive,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    try {
      await batch.commit()
      showNotification('Learner packs updated.', 'success')
      setEditingProfile(null)
    } catch {
      showNotification('Unable to update learner packs.', 'error')
    }
  }

  if (!classroom) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(ROUTES.CLASSES)}>
          Back to classes
        </Button>
        <Typography sx={{ mt: 3 }} color="text.secondary">
          {classLoading
            ? 'Loading class details...'
            : classExists
              ? 'Loading class details...'
              : 'Class not found.'}
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, mb: 6 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(ROUTES.CLASSES)}
        sx={{ mb: 2 }}
      >
        Back to classes
      </Button>

      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {classroom.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatClassGrade(classroom.grade)} &bull;{' '}
                  {classroom.schoolYear}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {classroom.subject ? (
                    <Chip size="small" label={classroom.subject} />
                  ) : null}
                  {classroom.section ? (
                    <Chip size="small" label={`Section ${classroom.section}`} />
                  ) : null}
                  {classroom.room ? (
                    <Chip size="small" label={`Room ${classroom.room}`} />
                  ) : null}
                </Stack>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => {
                  setDraftEdit({
                    name: classroom.name,
                    schoolYear: classroom.schoolYear,
                    grade: classroom.grade,
                    subject: classroom.subject ?? '',
                    section: classroom.section ?? '',
                    room: classroom.room ?? '',
                  })
                  setIsEditDialogOpen(true)
                }}
              >
                Edit class
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Class pack defaults
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set the pack baseline for this class or push updates to every
                  learner.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Enabled packs
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {classDefaults.enabledPacks.map((pack) => (
                      <Chip
                        key={pack}
                        size="small"
                        label={PACK_LABELS[pack] ?? pack}
                      />
                    ))}
                  </Stack>
                </Box>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="caption" color="text.secondary">
                    Active pack
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {PACK_LABELS[classDefaults.activePack] ??
                      classDefaults.activePack}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => setEditingProfile({
                    id: 'defaults',
                    profileId: 'defaults',
                    displayName: 'Class defaults',
                    loginName: '',
                    gradeLevel: null,
                    enabledPacks: classDefaults.enabledPacks,
                    activePack: classDefaults.activePack,
                    addedAt: null,
                    addedBy: user?.uid ?? '',
                  })}
                >
                  Edit defaults
                </Button>
                <Button
                  variant="contained"
                  disabled={isApplyPending || roster.length === 0}
                  onClick={handleApplyDefaultsToRoster}
                >
                  Apply to all learners
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Learners
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add learner profiles and tune their practice packs.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setIsRosterDialogOpen(true)}
                disabled={availableProfiles.length === 0}
              >
                Add learners
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {rosterLoading ? (
              <Typography color="text.secondary">Loading learners...</Typography>
            ) : roster.length === 0 ? (
              <Typography color="text.secondary">
                No learners yet. Add profiles to start tracking this class.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Learner</TableCell>
                    <TableCell>Active pack</TableCell>
                    <TableCell>Enabled packs</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roster.map((entry) => (
                    <TableRow key={entry.profileId} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {entry.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.loginName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {PACK_LABELS[entry.activePack ?? classDefaults.activePack] ??
                          entry.activePack ??
                          classDefaults.activePack}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {(entry.enabledPacks ?? classDefaults.enabledPacks).map(
                            (pack) => (
                              <Chip
                                key={pack}
                                size="small"
                                label={PACK_LABELS[pack] ?? pack}
                              />
                            )
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setEditingProfile(entry)}
                          >
                            Packs
                          </Button>
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveProfile(entry)}
                          >
                            <DeleteOutline />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Stack>

      <Dialog
        open={isRosterDialogOpen}
        onClose={() => {
          setIsRosterDialogOpen(false)
          setSelectedProfiles([])
        }}
      >
        <DialogTitle>Add learners</DialogTitle>
        <DialogContent>
          <List dense>
            {availableProfiles.map((profile) => {
              const selected = selectedProfiles.includes(profile.id)
              return (
                <ListItem key={profile.id} disablePadding>
                  <ListItemButton
                    selected={selected}
                    onClick={() =>
                      setSelectedProfiles((prev) =>
                        prev.includes(profile.id)
                          ? prev.filter((id) => id !== profile.id)
                          : [...prev, profile.id]
                      )
                    }
                  >
                    <ListItemText
                      primary={profile.displayName}
                      secondary={profile.loginName}
                    />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setIsRosterDialogOpen(false)
              setSelectedProfiles([])
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddProfiles}
            disabled={selectedProfiles.length === 0}
          >
            Add selected
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Edit class details</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Class name"
              value={draftEdit.name}
              onChange={(event) =>
                setDraftEdit((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <TextField
              label="School year"
              value={draftEdit.schoolYear}
              onChange={(event) =>
                setDraftEdit((prev) => ({
                  ...prev,
                  schoolYear: event.target.value,
                }))
              }
            />
            <FormControl>
              <InputLabel id="edit-grade-label">Grade</InputLabel>
              <Select
                labelId="edit-grade-label"
                label="Grade"
                value={draftEdit.grade}
                onChange={(event) =>
                  setDraftEdit((prev) => ({
                    ...prev,
                    grade: event.target.value as GradeLevel,
                  }))
                }
              >
                {CLASS_GRADE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Subject (optional)"
              value={draftEdit.subject}
              onChange={(event) =>
                setDraftEdit((prev) => ({
                  ...prev,
                  subject: event.target.value,
                }))
              }
            />
            <TextField
              label="Section (optional)"
              value={draftEdit.section}
              onChange={(event) =>
                setDraftEdit((prev) => ({
                  ...prev,
                  section: event.target.value,
                }))
              }
            />
            <TextField
              label="Room (optional)"
              value={draftEdit.room}
              onChange={(event) =>
                setDraftEdit((prev) => ({ ...prev, room: event.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateClassDetails}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {editingProfile ? (
        <PackSettingsDialog
          open={Boolean(editingProfile)}
          title={
            editingProfile.profileId === 'defaults'
              ? 'Edit class pack defaults'
              : `Edit packs for ${editingProfile.displayName}`
          }
          enabledPacks={
            editingProfile.profileId === 'defaults'
              ? classDefaults.enabledPacks
              : (editingProfile.enabledPacks ?? classDefaults.enabledPacks)
          }
          activePack={
            editingProfile.profileId === 'defaults'
              ? classDefaults.activePack
              : (editingProfile.activePack ?? classDefaults.activePack)
          }
          onClose={() => setEditingProfile(null)}
          onSave={(nextEnabled, nextActive) => {
            if (editingProfile.profileId === 'defaults') {
              handleSaveClassPacks(nextEnabled, nextActive)
              return
            }
            handleSaveProfilePacks(editingProfile, nextEnabled, nextActive)
          }}
        />
      ) : null}
    </Container>
  )
}

export default ClassDetailPage
