import {
  type ChangeEvent,
  type FC,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Box, type SelectChangeEvent } from '@mui/material'
import {
  collection,
  doc,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

import SaveProgressModal from '../../components/Login/SaveProgressModal'
import SetPinModal from '../../components/Login/SetPinModal'
import SavedScenesGallery from '../../components/SavedScenesGallery/SavedScenesGallery'
import SceneThemeSelect from '../../components/SceneThemeSelect/SceneThemeSelect'
import {
  ALL_PACKS,
  FREE_PACKS,
  MAX_NEW_CARDS_PER_DAY,
} from '../../constants/appConstants'
import type { PackKey, UserProfile } from '../../constants/dataModels'
import { useFirebaseContext } from '../../contexts/firebase/firebaseContext'
import { useModal } from '../../contexts/modalContext/modalContext'
import { useSessionStatusContext } from '../../contexts/SessionStatusContext/sessionStatusContext'
import { useThemeContext } from '../../contexts/themeContext/themeContext'
import { useUser } from '../../contexts/userContext/useUserContext'
import { useFirestoreQuery } from '../../hooks/useFirestore'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useNotification } from '../../contexts/notificationContext/notificationContext'
import UpgradeModal from '../../components/UpgradeModal/UpgradeModal'
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
  const { showNotification } = useNotification()
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
  const isTeacher = user?.userRole === 'teacher'
  const isPremium = user?.subscriptionStatus === 'premium'
  const learnerProfileCount = profiles.filter(
    (p) => p.id !== user?.primaryProfileId
  ).length
  const isAtLearnerLimit =
    !isPremium && user?.userRole === 'parent' && learnerProfileCount >= 1
  const canAddLearner =
    !isProfileSession && user?.userRole === 'parent' && !isAtLearnerLimit

  const ownerProfileId =
    isTeacher || user?.userRole === 'parent'
      ? (user?.primaryProfileId ?? null)
      : null

  const isOwnerViewingLearner =
    isTeacher &&
    Boolean(ownerProfileId) &&
    Boolean(activeProfileId) &&
    ownerProfileId !== activeProfileId

  const profilesToShow = isTeacher
    ? profiles.filter((profileItem) =>
        [ownerProfileId, activeProfileId].includes(profileItem.id)
      )
    : profiles

  const handleReturnToOwner = async () => {
    if (!ownerProfileId) return
    await setActiveProfileId(ownerProfileId)
  }

  const handleSelectProfile = async (profileId: string) => {
    await setActiveProfileId(profileId)
  }

  const handleLearnerCreated = async (payload: { profileId: string }) => {
    if (!db || !user?.uid || !payload.profileId) return
    try {
      await updateDoc(
        doc(db, 'users', user.uid, 'profiles', payload.profileId),
        {
          onboardingCompleted: true,
          showTour: false,
          updatedAt: serverTimestamp(),
        }
      )
    } catch {
      showNotification('Unable to finish learner setup.', 'error')
    }
  }

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
          canEnablePinSignIn={canEnablePinSignIn}
          hasPinSignIn={hasPinSignIn}
          isAnonymous={Boolean(isAnonymous)}
          showReturnToOwner={isOwnerViewingLearner}
          showAddLearner={canAddLearner || isAtLearnerLimit}
          onAddLearner={() => {
            if (isAtLearnerLimit) {
              openModal(<UpgradeModal onClose={closeModal} />)
              return
            }
            openModal(
              <AddLearnerModal
                onClose={closeModal}
                onCreated={handleLearnerCreated}
              />
            )
          }}
          onEnablePin={() => openModal(<SetPinModal onClose={closeModal} />)}
          onSaveProgress={() =>
            openModal(<SaveProgressModal onClose={closeModal} />)
          }
          onReturnToOwner={handleReturnToOwner}
        />

        {profilesToShow.length > 0 && !isProfileSession ? (
          <LearnerProfilesSection
            profiles={profilesToShow}
            activeProfileId={activeProfileId}
            onSelectProfile={handleSelectProfile}
            title={
              user?.userRole === 'teacher' || user?.userRole === 'parent'
                ? 'Profiles'
                : undefined
            }
            description={
              user?.userRole === 'teacher' || user?.userRole === 'parent'
                ? 'Switch between your profile and your learners.'
                : undefined
            }
          />
        ) : null}

        <ActiveFactPackSection
          activePack={profile?.activePack || ''}
          enabledPacks={
            (user?.subscriptionStatus === 'premium'
              ? ALL_PACKS
              : FREE_PACKS) as PackKey[]
          }
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
