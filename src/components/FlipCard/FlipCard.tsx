import {
  type FC,
  type KeyboardEvent,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useState,
} from 'react'
import {
  Box,
  Card,
  type CardProps,
  type SxProps,
  type Theme,
} from '@mui/material'

interface Props extends CardProps {
  front: ReactNode
  back: ReactNode
  cardSx?: SxProps<Theme>
  /** Extra styles applied to both faces (front/back). */
  faceSx?: SxProps<Theme>
  ariaLabel?: string
  props?: PropsWithChildren
}

const FlipCard: FC<Props> = ({
  front,
  back,
  cardSx,
  faceSx,
  ariaLabel,
  props,
}) => {
  const [isFlipped, setIsFlipped] = useState(false)

  const toggle = useCallback(() => {
    setIsFlipped((v) => !v)
  }, [])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat) {
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        toggle()
      }
    },
    [toggle],
  )

  const onKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        toggle()
      }
    },
    [toggle],
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
      onKeyUp={onKeyUp}
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
      {...props}
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
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none',
            },
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            display: 'grid',
          }}
        >
          <Box
            aria-hidden={isFlipped}
            sx={{
              gridArea: '1 / 1',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              pointerEvents: isFlipped ? 'none' : 'auto',
              ...faceSx,
            }}
          >
            {front}
          </Box>

          <Box
            aria-hidden={!isFlipped}
            sx={{
              gridArea: '1 / 1',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              pointerEvents: !isFlipped ? 'none' : 'auto',
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
