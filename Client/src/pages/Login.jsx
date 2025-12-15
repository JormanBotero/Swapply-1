import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Login.css'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function Login() {
  const [form, setForm] = useState({ correo: '', contrasena: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [activeInput, setActiveInput] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFocus = (field) => setActiveInput(field)
  const handleBlur = () => setActiveInput(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    
    if (!form.correo.trim()) newErrors.correo = 'Ingresa un correo electrónico'
    else if (!/\S+@\S+\.\S+/.test(form.correo)) newErrors.correo = 'Correo electrónico no válido'
    
    if (!form.contrasena) newErrors.contrasena = 'Ingresa una contraseña'
    
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    
    try {
      setIsLoading(true)
      setSubmitError('')
      await login({ correo: form.correo, contrasena: form.contrasena })
      // CAMBIA ESTA LÍNEA:
      navigate('/products', { replace: true }) // ← De dashboard a products
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.')
    } finally {
      setIsLoading(false)
    }
  }

  // CAMBIA ESTA FUNCIÓN TAMBIÉN:
  const handleGoogleSuccess = () => navigate('/products', { replace: true }) // ← De dashboard a products

  return (
    <div className="login-page">
      <div className="login-container minimal">
        <h1 className="login-title">Bienvenido a Swapply</h1>
        <p className="login-subtitle">Inicia sesión para continuar</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <input
              type="email"
              name="correo"
              placeholder="Correo electrónico (ej: usuario@correo.com)"
              value={form.correo}
              onChange={handleChange}
              onFocus={() => handleFocus('correo')}
              onBlur={handleBlur}
              disabled={isLoading}
              className={errors.correo ? 'input-error' : ''}
            />
            {errors.correo && <div className="error-message">{errors.correo}</div>}
          </div>

          <div className="form-group">
            <input
              type="password"
              name="contrasena"
              placeholder="Contraseña"
              value={form.contrasena}
              onChange={handleChange}
              onFocus={() => handleFocus('contrasena')}
              onBlur={handleBlur}
              disabled={isLoading}
              className={errors.contrasena ? 'input-error' : ''}
            />
            {errors.contrasena && <div className="error-message">{errors.contrasena}</div>}
          </div>

          {submitError && <div className="submit-error">{submitError}</div>}

          <button type="submit" className={`login-button ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <div className="divider">
            <span>o inicia sesión con</span>
          </div>

          <div className="social-login">
            <GoogleLoginButton onSuccess={handleGoogleSuccess} />
          </div>

          <div className="register-link">
            <p>
              ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
            </p>
          </div>

          <div className="forgot-password-link">
            <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
