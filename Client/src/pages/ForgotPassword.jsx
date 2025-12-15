import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { requestPasswordReset, verifyPasswordReset, resetPassword } from '../services/auth'
import './register.css'

export default function ForgotPassword() {
  const [correo, setCorreo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [sent, setSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const navigate = useNavigate()

  const sendCode = async () => {
    setError('')
    setMessage('')
    if (!correo.trim()) { setError('Ingresa un correo'); return }
    try {
      setLoading(true)
      await requestPasswordReset(correo)
      setSent(true)
      setMessage('Código enviado. Revisa tu correo.')
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo enviar el código')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    setError('')
    setMessage('')
    if (!codigo.trim()) { setError('Ingresa el código'); return }
    try {
      setLoading(true)
      await verifyPasswordReset(correo, codigo)
      setVerified(true)
      setMessage('Código verificado ✅')
    } catch (err) {
      setError(err?.response?.data?.message || 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  const submitReset = async () => {
    setError('')
    setMessage('')
    if (!pw1 || pw1.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (pw1 !== pw2) { setError('Las contraseñas no coinciden'); return }
    try {
      setLoading(true)
      await resetPassword(correo, codigo, pw1)
      setMessage('Contraseña actualizada ✅')
      setTimeout(() => navigate('/login', { replace: true }), 1200)
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <h1 className="register-title">Restablecer contraseña</h1>

        <form className="register-form" onSubmit={(e)=> e.preventDefault()} noValidate>
          <label htmlFor="correo">Correo</label>
          <div className="inline-row">
            <input
              type="email"
              id="correo"
              name="correo"
              placeholder="ejemplo@correo.com"
              value={correo}
              onChange={(e)=> setCorreo(e.target.value)}
              disabled={verified}
            />
            <button type="button" className="verify-btn" onClick={sendCode} disabled={loading || verified}>
              {loading ? 'Enviando…' : sent ? 'Reenviar' : 'Enviar código'}
            </button>
          </div>

          {sent && !verified && (
            <>
              <label htmlFor="codigo">Código de verificación</label>
              <div className="inline-row">
                <input
                  type="text"
                  id="codigo"
                  name="codigo"
                  placeholder="Ingresa el código"
                  value={codigo}
                  onChange={(e)=> setCodigo(e.target.value)}
                />
                <button type="button" className="verify-btn" onClick={verifyCode} disabled={loading}>Verificar</button>
              </div>
            </>
          )}

          {verified && (
            <>
              <label htmlFor="pw1">Nueva contraseña</label>
              <input type="password" id="pw1" placeholder="••••••••" value={pw1} onChange={(e)=> setPw1(e.target.value)} />
              <label htmlFor="pw2">Confirmar contraseña</label>
              <input type="password" id="pw2" placeholder="••••••••" value={pw2} onChange={(e)=> setPw2(e.target.value)} />
              <button type="button" className="register-submit" onClick={submitReset} disabled={loading}>
                Actualizar contraseña
              </button>
            </>
          )}

          {error && <p className="error-message">{error}</p>}
          {message && <p className="status-message">{message}</p>}

          <p className="register-switch">Volver a <Link to="/login">Iniciar sesión</Link></p>
        </form>
      </div>
    </div>
  )
}
