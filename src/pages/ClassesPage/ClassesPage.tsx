import { useMemo, useState, type FC } from 'react'
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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Add } from '@mui/icons-material'
import {
  addDoc,
  collection,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { useFirestoreQuery } from '../../hooks/useFirestore'
import { useNotification } from '../../contexts/notificationContext/notificationContext'
import type { Classroom, GradeLevel } from '../../constants/dataModels'
import { ROUTES } from '../../constants/routeConstants'
import { PACK_LABELS } from '../ProfilePage/components/profileConstants'
import {
  ALL_PACKS,
  CLASS_GRADE_OPTIONS,
  FREE_PACKS,
  MUL_36,
} from '../../constants/appConstants'

const formatClassGrade = (grade: GradeLevel) => {
  return CLASS_GRADE_OPTIONS.find((option) => option.value === grade)?.label
}

const ClassesPage: FC = () => {
  const { user } = useUser()
  const { db } = useFirebaseContext()
  const { showNotification } = useNotification()
  const navigate = useNavigate()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [draft, setDraft] = useState({
    name: '',
    schoolYear: '',
    grade: '3' as GradeLevel,
    subject: '',
    section: '',
    room: '',
  })

  const classesQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, 'users', user.uid, 'classrooms'),
      orderBy('createdAt', 'desc')
    )
  }, [db, user?.uid])

  const { data: classrooms, loading } =
    useFirestoreQuery<Classroom>(classesQuery)

  const handleCreate = async () => {
    if (!db || !user?.uid) return
    if (!draft.name.trim() || !draft.schoolYear.trim()) {
      showNotification('Add a class name and school year.', 'warning')
      return
    }

    setIsSaving(true)
    try {
      await addDoc(collection(db, 'users', user.uid, 'classrooms'), {
        name: draft.name.trim(),
        schoolYear: draft.schoolYear.trim(),
        grade: draft.grade,
        subject: draft.subject.trim() || null,
        section: draft.section.trim() || null,
        room: draft.room.trim() || null,
        defaultEnabledPacks:
          user?.subscriptionStatus === 'premium' ? ALL_PACKS : FREE_PACKS,
        defaultActivePack: MUL_36,
        rosterCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      showNotification('Class created.', 'success')
      setIsCreateOpen(false)
      setDraft({
        name: '',
        schoolYear: '',
        grade: '3',
        subject: '',
        section: '',
        room: '',
      })
    } catch {
      showNotification('Unable to create class.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, mb: 6 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Classes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Group learners, set packs, and track class progress.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsCreateOpen(true)}
        >
          New Class
        </Button>
      </Stack>

      {loading ? (
        <Typography color="text.secondary">Loading classes...</Typography>
      ) : classrooms.length === 0 ? (
        <Card sx={{ borderStyle: 'dashed' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              No classes yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create your first class to organize learners and pack settings.
            </Typography>
            <Button variant="contained" onClick={() => setIsCreateOpen(true)}>
              Create a class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {classrooms.map((room) => (
            <Grid key={room.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {room.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatClassGrade(room.grade) ?? room.grade} &bull;{' '}
                        {room.schoolYear}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {room.subject ? (
                        <Chip size="small" label={room.subject} />
                      ) : null}
                      {room.section ? (
                        <Chip size="small" label={`Section ${room.section}`} />
                      ) : null}
                      {room.room ? (
                        <Chip size="small" label={`Room ${room.room}`} />
                      ) : null}
                    </Stack>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Learners
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {room.rosterCount ?? 0}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Default pack
                      </Typography>
                      <Typography variant="body2">
                        {room.defaultActivePack
                          ? (PACK_LABELS[room.defaultActivePack] ??
                            room.defaultActivePack)
                          : 'Not set'}
                      </Typography>
                    </Box>

                    <Button
                      variant="outlined"
                      onClick={() => navigate(`${ROUTES.CLASSES}/${room.id}`)}
                    >
                      View class
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <DialogTitle>Create a class</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Class name"
              value={draft.name}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Ms. Rivera's Math"
            />
            <TextField
              label="School year"
              value={draft.schoolYear}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  schoolYear: event.target.value,
                }))
              }
              placeholder="2025-2026"
            />
            <FormControl>
              <InputLabel id="class-grade-label">Grade</InputLabel>
              <Select
                labelId="class-grade-label"
                label="Grade"
                value={draft.grade}
                onChange={(event) =>
                  setDraft((prev) => ({
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
              value={draft.subject}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, subject: event.target.value }))
              }
              placeholder="Math"
            />
            <TextField
              label="Section (optional)"
              value={draft.section}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, section: event.target.value }))
              }
              placeholder="A"
            />
            <TextField
              label="Room (optional)"
              value={draft.room}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, room: event.target.value }))
              }
              placeholder="203"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={isSaving}
          >
            Create class
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default ClassesPage
