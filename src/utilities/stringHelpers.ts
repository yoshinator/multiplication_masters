export function capitalizeFirstLetter(str: string | null | undefined): string {
  if (str?.length === 0) return str
  if (!str) return ''
  return str[0].toUpperCase() + str.slice(1)
}
