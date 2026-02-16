import { ROUTES } from './routeConstants'

export const PUBLIC_INFO_ROUTES = [
  ROUTES.LEARN_MORE,
  ROUTES.PRIVACY,
  ROUTES.TERMS,
  ROUTES.COPPA,
  ROUTES.FERPA,
] as const

export const isPublicInfoPath = (
  pathname: string,
  options?: { includeHome?: boolean }
): boolean => {
  if (options?.includeHome && pathname === ROUTES.HOME) {
    return true
  }

  return (PUBLIC_INFO_ROUTES as readonly string[]).includes(pathname)
}
