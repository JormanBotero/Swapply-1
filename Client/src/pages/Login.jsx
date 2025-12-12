import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './login.css'
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
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFocus = (field) => {
    setActiveInput(field)
  }

  const handleBlur = () => {
    setActiveInput(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    
    if (!form.correo.trim()) {
      newErrors.correo = 'Ingresa un correo electrónico'
    } else if (!/\S+@\S+\.\S+/.test(form.correo)) {
      newErrors.correo = 'Correo electrónico no válido'
    }
    
    if (!form.contrasena) {
      newErrors.contrasena = 'Ingresa una contraseña'
    }
    
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    
    try {
      setIsLoading(true)
      setSubmitError('')
      
      await login({ correo: form.correo, contrasena: form.contrasena })
      
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 300)
      
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setForm({ correo: 'demo@ejemplo.com', contrasena: 'demo123' })
    setErrors({})
    setSubmitError('')
  }

  const handleGoogleSuccess = () => {
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="background-shape shape-1"></div>
        <div className="background-shape shape-2"></div>
        <div className="background-shape shape-3"></div>
      </div>
      
      <div className="login-container">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L20 12L30 16L20 20L16 30L12 20L2 16L12 12L16 2Z" fill="var(--primary)" />
              </svg>
            </div>
            <h1 className="app-name">MiApp</h1>
          </div>
          <h2 className="login-title">Iniciar Sesión</h2>
          <p className="login-subtitle">Accede a tu cuenta para continuar</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <div className={`input-container ${activeInput === 'correo' ? 'active' : ''} ${errors.correo ? 'error' : ''}`}>
              <input
                type="email"
                id="correo"
                name="correo"
                placeholder="Correo electrónico"
                value={form.correo}
                onChange={handleChange}
                onFocus={() => handleFocus('correo')}
                onBlur={handleBlur}
                aria-label="Correo electrónico"
                aria-invalid={!!errors.correo}
                disabled={isLoading}
              />
              <div className="input-decoration"></div>
              {errors.correo && (
                <div className="error-icon">!</div>
              )}
            </div>
            {errors.correo && (
              <div className="error-message" role="alert">
                {errors.correo}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <div className={`input-container ${activeInput === 'contrasena' ? 'active' : ''} ${errors.contrasena ? 'error' : ''}`}>
              <input
                type="password"
                id="contrasena"
                name="contrasena"
                placeholder="Contraseña"
                value={form.contrasena}
                onChange={handleChange}
                onFocus={() => handleFocus('contrasena')}
                onBlur={handleBlur}
                aria-label="Contraseña"
                aria-invalid={!!errors.contrasena}
                disabled={isLoading}
              />
              <div className="input-decoration"></div>
              {errors.contrasena && (
                <div className="error-icon">!</div>
              )}
            </div>
            {errors.contrasena && (
              <div className="error-message" role="alert">
                {errors.contrasena}
              </div>
            )}
          </div>
          
          <div className="form-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" disabled={isLoading} />
              <label htmlFor="remember">Recordarme</label>
            </div>
            <Link to="/recuperar-contrasena" className="forgot-password">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          
          {submitError && (
            <div className="submit-error" role="alert">
              {submitError}
            </div>
          )}
          
          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Iniciando sesión...
              </>
            ) : 'Iniciar Sesión'}
          </button>
          
          <div className="divider">
            <span>o continúa con</span>
          </div>
          
          <div className="social-login">
            <GoogleLoginButton onSuccess={handleGoogleSuccess} />
          </div>
          
          <div className="demo-section">
            <p className="demo-text">¿Quieres probar el sistema?</p>
            <button 
              type="button" 
              className="demo-button"
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              Usar cuenta de demostración
            </button>
          </div>
          
          <div className="register-link">
            <p>
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="register-text">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>
        
        <div className="login-footer">
          <p className="footer-text">
            © {new Date().getFullYear()} MiApp. Todos los derechos reservados.
          </p>
          <div className="footer-links">
            <Link to="/terminos">Términos</Link>
            <span className="separator">•</span>
            <Link to="/privacidad">Privacidad</Link>
            <span className="separator">•</span>
            <Link to="/ayuda">Ayuda</Link>
          </div>
        </div>
      </div>
    </div>
  )
}