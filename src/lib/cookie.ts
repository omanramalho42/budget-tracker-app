export function setCookie(
  name: string,
  value: string,
  days = 30,
) {
  const expires = new Date()
  expires.setDate(expires.getDate() + days)

  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; expires=${expires.toUTCString()}; path=/`
}

export function getCookie(name: string) {
  if (typeof document === 'undefined') return null

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))

  return match ? decodeURIComponent(match.split('=')[1]) : null
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
}
