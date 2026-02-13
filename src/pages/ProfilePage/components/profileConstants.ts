import type { PackKey } from '../../../constants/dataModels'

export const PACK_LABELS: Partial<Record<PackKey, string>> = {
  mul_144: 'Multiplication to 144',
  mul_36: 'Multiplication to 36',
  mul_576: 'Multiplication to 576',
  div_144: 'Division 144',
  add_20: 'Addition to 20',
  sub_20: 'Subtraction within 20',
}

export const PROFILE_GRADE_OPTIONS = [
  { value: 0, label: 'K' },
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: 5, label: '5th' },
  { value: 6, label: '6th' },
  { value: 7, label: '7th' },
  { value: 8, label: '8th' },
  { value: 9, label: '9th' },
  { value: 10, label: '10th' },
  { value: 11, label: '11th' },
  { value: 12, label: '12th' },
]

export const formatProfileGrade = (grade: number | null | undefined) => {
  if (grade === null || grade === undefined) return 'Not set'
  const match = PROFILE_GRADE_OPTIONS.find((option) => option.value === grade)
  return match?.label ?? `Grade ${grade}`
}
