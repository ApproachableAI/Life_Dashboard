import { useCallback, useEffect, useRef, useState } from 'react'
import { loadGis, CALENDAR_SCOPE, fetchUserEmail } from '../lib/googleCalendar'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
export const googleConfigured = Boolean(CLIENT_ID)

// Each person keeps their own Google connection, so the token is stored per
// person. Tokens are short-lived (about an hour) and we keep them only in this
// browser's localStorage — never in the shared database.
const storageKey = (person) => `gcal_${person}`

export function useGoogleCalendar(person) {
  const [token, setToken] = useState(null)
  const [email, setEmail] = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const clientRef = useRef(null)

  // Restore a still-valid token (or at least the remembered email) on mount.
  useEffect(() => {
    if (!googleConfigured) return
    setToken(null)
    setConnected(false)
    setEmail(null)
    try {
      const raw = localStorage.getItem(storageKey(person))
      if (!raw) return
      const saved = JSON.parse(raw)
      if (saved.expires_at && saved.expires_at > Date.now() + 60_000) {
        setToken(saved.access_token)
        setEmail(saved.email)
        setConnected(true)
      } else if (saved.email) {
        // Token expired but we know this person granted access before — keep
        // the email so we can silently refresh on next use.
        setEmail(saved.email)
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, [person])

  function persist(accessToken, expiresIn, mail) {
    const expires_at = Date.now() + (expiresIn - 60) * 1000
    localStorage.setItem(
      storageKey(person),
      JSON.stringify({ access_token: accessToken, expires_at, email: mail }),
    )
  }

  async function ensureClient() {
    await loadGis()
    if (!clientRef.current) {
      clientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: CALENDAR_SCOPE,
        callback: () => {},
      })
    }
    return clientRef.current
  }

  function requestToken(prompt) {
    return new Promise((resolve, reject) => {
      ensureClient()
        .then((client) => {
          client.callback = (resp) => {
            if (resp.error) reject(resp)
            else resolve(resp)
          }
          client.requestAccessToken({ prompt })
        })
        .catch(reject)
    })
  }

  // Interactive connect: try a silent grant first, fall back to the consent
  // popup so already-authorized accounts don't have to re-approve every time.
  const connect = useCallback(async () => {
    setError(null)
    try {
      let resp
      try {
        resp = await requestToken('')
      } catch {
        resp = await requestToken('consent')
      }
      const mail = await fetchUserEmail(resp.access_token)
      persist(resp.access_token, resp.expires_in, mail)
      setToken(resp.access_token)
      setEmail(mail)
      setConnected(true)
      return resp.access_token
    } catch (e) {
      setError('Could not connect to Google.')
      throw e
    }
  }, [person])

  // Get a usable token for an API call, silently refreshing if the cached one
  // has expired.
  const getToken = useCallback(async () => {
    if (token) return token
    const resp = await requestToken('')
    const mail = email || (await fetchUserEmail(resp.access_token))
    persist(resp.access_token, resp.expires_in, mail)
    setToken(resp.access_token)
    setEmail(mail)
    setConnected(true)
    return resp.access_token
  }, [token, email, person])

  const disconnect = useCallback(() => {
    try {
      if (token && window.google?.accounts?.oauth2) {
        window.google.accounts.oauth2.revoke(token, () => {})
      }
    } catch {
      /* best effort */
    }
    localStorage.removeItem(storageKey(person))
    setToken(null)
    setEmail(null)
    setConnected(false)
  }, [token, person])

  return {
    configured: googleConfigured,
    connected,
    email,
    error,
    connect,
    disconnect,
    getToken,
  }
}
