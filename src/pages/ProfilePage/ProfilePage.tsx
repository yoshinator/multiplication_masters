import {
  type ChangeEvent,
  type FC,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Box, type SelectChangeEvent } from '@mui/material'
import { collection, query } from 'firebase/firestore'

import SaveProgressModal from '../../components/Login/SaveProgressModal'
import SetPinModal from '../../components/Login/SetPinModal'
import SavedScenesGallery from '../../components/SavedScenesGallery/SavedScenesGallery'
import SceneThemeSelect from '../../components/SceneThemeSelect/SceneThemeSelect'
import { MAX_NEW_CARDS_PER_DAY } from '../../constants/appConstants'
import type { PackKey, UserProfile } from '../../constants/dataModels'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { useModal } from '../../contexts/modalContext/modalContext'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { useThemeContext } from '../../contexts/themeContext/themeContext'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useFirestoreQuery } from '../../hooks/useFirestore'
import { useIsMobile } from '../../hooks/useIsMobile'
import ActiveFactPackSection from './components/ActiveFactPackSection'
import AddLearnerModal from './components/AddLearnerModal'
import DisplayPreferencesSection from './components/DisplayPreferencesSection'
import LearnerProfilesSection from './components/LearnerProfilesSection'
import ProfileHeaderSection from './components/ProfileHeaderSection'
import ProfileSectionCard from './components/ProfileSectionCard'
import SessionSettingsSection from './components/SessionSettingsSection'
import { getProfileOptionButtonStyle } from './components/profileUi'

const ProfilePage: FC = () => {
  const { auth, db } = useFirebaseContext()
  const { openModal, closeModal } = useModal()
  const isMobile = useIsMobile()
  const { mode, setMode } = useThemeContext()
  const { sessionLength } = useSessionStatusContext()
  const { updateUser, user, profile, activeProfileId, setActiveProfileId } =
    useUser()

  const [profileSessionId, setProfileSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (!auth?.currentUser) {
      setProfileSessionId(null)
      return
    }

    auth.currentUser
      .getIdTokenResult()
      .then((result) => {
        const claim = result.claims.profileId
        setProfileSessionId(typeof claim === 'string' ? claim : null)
      })
      .catch(() => setProfileSessionId(null))
  }, [auth?.currentUser])

  const isProfileSession = Boolean(profileSessionId)

  const profilesQuery = useMemo(() => {
    if (!db || !user?.uid || isProfileSession) return null
    return query(collection(db, 'users', user.uid, 'profiles'))
  }, [db, user?.uid, isProfileSession])

  const { data: profiles } = useFirestoreQuery<UserProfile>(profilesQuery)

  const handleChoiceKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.currentTarget.click()
    }
  }

  const handlePackChange = (event: SelectChangeEvent<PackKey | ''>) => {
    const nextPack = event.target.value
    if (!nextPack) return
    updateUser({ activePack: nextPack })
  }

  const handleThemeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMode(event.target.value as 'light' | 'dark' | 'system')
  }

  const handleShowTourChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateUser({ showTour: event.target.checked })
  }

  const isAnonymous = auth?.currentUser?.isAnonymous
  const providerIds =
    auth?.currentUser?.providerData?.map((provider) => provider.providerId) ||
    []
  const canEnablePinSignIn =
    Boolean(auth?.currentUser) &&
    !isAnonymous &&
    (providerIds.includes('google.com') || providerIds.includes('password'))

  const hasPinSignIn = Boolean(profile?.pinEnabled)
  const canManageProfiles = !isProfileSession

  return (
    <Box
      sx={{
        px: { xs: 1, sm: 2 },
        py: { xs: 1, sm: 2 },
        mb: 6,
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          display: 'grid',
          gap: 2,
        }}
      >
        <ProfileHeaderSection
          title={profile?.displayName ?? 'Student Profile'}
          canManageProfiles={canManageProfiles}
          canEnablePinSignIn={canEnablePinSignIn}
          hasPinSignIn={hasPinSignIn}
          isAnonymous={Boolean(isAnonymous)}
          onAddLearner={() =>
            openModal(<AddLearnerModal onClose={closeModal} />)
          }
          onEnablePin={() => openModal(<SetPinModal onClose={closeModal} />)}
          onSaveProgress={() =>
            openModal(<SaveProgressModal onClose={closeModal} />)
          }
        />

        {canManageProfiles ? (
          <LearnerProfilesSection
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelectProfile={setActiveProfileId}
          />
        ) : null}

        <ActiveFactPackSection
          activePack={profile?.activePack || ''}
          enabledPacks={(profile?.enabledPacks || []) as PackKey[]}
          onPackChange={handlePackChange}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: '1.2fr 0.8fr' },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <SessionSettingsSection
            isMobile={isMobile}
            sessionLength={sessionLength}
            maxNewCardsPerDay={
              profile?.maxNewCardsPerDay ?? MAX_NEW_CARDS_PER_DAY
            }
            onChoiceKeyDown={handleChoiceKeyDown}
            onSessionLengthChange={(value) =>
              updateUser({ userDefaultSessionLength: value })
            }
            onMaxNewCardsChange={(value) =>
              updateUser({ maxNewCardsPerDay: value })
            }
          />

          <DisplayPreferencesSection
            mode={mode}
            showTour={Boolean(profile?.showTour)}
            onThemeChange={handleThemeChange}
            onShowTourChange={handleShowTourChange}
          />
        </Box>

        <ProfileSectionCard>
          <SceneThemeSelect
            getOptionButtonStyle={getProfileOptionButtonStyle}
            handleChoiceKeyDown={handleChoiceKeyDown}
          />
          <SavedScenesGallery />
        </ProfileSectionCard>
      </Box>
    </Box>
  )
}

export default ProfilePage
