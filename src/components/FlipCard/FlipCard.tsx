import {
  type FC,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useState,
} from 'react'
import { Box, Card, type SxProps, type Theme } from '@mui/material'

type Props = {
  front: ReactNode
  back: ReactNode
  cardSx?: SxProps<Theme>
  /** Extra styles applied to both faces (front/back). */
  faceSx?: SxProps<Theme>
  ariaLabel?: string
}

const FlipCard: FC<Props> = ({ front, back, cardSx, faceSx, ariaLabel }) => {
  const [isFlipped, setIsFlipped] = useState(false)

  const toggle = useCallback(() => {
    setIsFlipped((v) => !v)
  }, [])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggle()
      }
    },
    [toggle]
  )

  return (
    <Card
      component={Box}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ?? 'Flip card'}
      aria-pressed={isFlipped}
      onClick={toggle}
      onKeyDown={onKeyDown}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none',
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
        ...cardSx,
      }}
    >
      <Box
        sx={{
          width: '100%',
          perspective: '1000px',
        }}
      >
        <Box
          sx={{
            width: '100%',
            transformStyle: 'preserve-3d',
            transition: 'transform 500ms ease',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            display: 'grid',
          }}
        >
          <Box
            sx={{
              gridArea: '1 / 1',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              ...faceSx,
            }}
          >
            {front}
          </Box>

          <Box
            sx={{
              gridArea: '1 / 1',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              ...faceSx,
            }}
          >
            {back}
          </Box>
        </Box>
      </Box>
    </Card>
  )
}

export default FlipCard
