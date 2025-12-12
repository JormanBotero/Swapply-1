import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

// Renders Google Identity Services button and exchanges credential for a session
export default function GoogleLoginButton({ onSuccess }) {
  const { loginGoogle } = useAuth()
  const btnRef = useRef(null)
  const [error, setError] = useState('')
  const [lastCredential, setLastCredential] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      setError('Falta VITE_GOOGLE_CLIENT_ID en el cliente')
      return
    }

    // Load GIS script if not present
    const id = 'google-identity'
    if (!document.getElementById(id)) {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.id = id
      document.head.appendChild(s)
      s.onload = init
    } else {
      init()
    }

    function init() {
      // global google object provided by GIS
      /* eslint-disable no-undef */
      if (typeof google === 'undefined') return
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          setLastCredential(response.credential)
          await attemptLogin(response.credential)
        },
      })
      if (btnRef.current) {
        google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'left',
          width: 260,
        })
      }
    }
  }, [])

  async function attemptLogin(credential) {
    try {
      setLoading(true)
      setError('')
      await loginGoogle(credential)
      onSuccess?.()
    } catch (e) {
      // ECONNRESET / network errors surface as generic Axios error w/ code
      const msg = e?.response?.data?.message || e.message || 'No se pudo iniciar sesión con Google'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div ref={btnRef} />
      {loading && <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Autenticando…</div>}
      {error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ color: '#ff6b6b', fontSize: '0.95rem', textAlign: 'center' }}>{error}</div>
          {lastCredential && !loading && (
            <button
              type="button"
              onClick={() => attemptLogin(lastCredential)}
              style={{
                background: 'transparent',
                color: '#fff',
                border: '1px solid #fff',
                padding: '6px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >Reintentar</button>
          )}
        </div>
      )}
    </div>
  )
}