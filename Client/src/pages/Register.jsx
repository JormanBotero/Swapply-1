import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import './Register.css'
import { requestEmailVerification, verifyEmailVerification } from '../services/auth'

export default function Register() {
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '', contrasena2: '', codigo: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [emailStatus, setEmailStatus] = useState({ sent: false, verified: false, loading: false, message: '' })
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))

    // Validaciones en tiempo real
    if (name === 'contrasena') validatePassword(value)
    if (name === 'contrasena2') {
      if (value !== form.contrasena) {
        setErrors((e) => ({ ...e, contrasena2: 'Las contraseñas no coinciden' }))
      } else {
        setErrors((e) => ({ ...e, contrasena2: '' }))
      }
    }
  }

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/
    if (!regex.test(password)) {
      setErrors((e) => ({
        ...e,
        contrasena: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial'
      }))
    } else {
      setErrors((e) => ({ ...e, contrasena: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!form.nombre.trim()) newErrors.nombre = 'Ingresa un nombre'
    if (!form.correo.trim()) newErrors.correo = 'Ingresa un correo'
    if (!form.contrasena) newErrors.contrasena = 'Ingresa una contraseña'
    if (form.contrasena !== form.contrasena2) newErrors.contrasena2 = 'Las contraseñas no coinciden'
    if (!emailStatus.verified) newErrors.correo = newErrors.correo || 'Verifica tu correo antes de registrarte'

    // Validación de contraseña final
    if (form.contrasena) {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/
      if (!regex.test(form.contrasena)) {
        newErrors.contrasena = 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial'
      }
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      setSubmitError('')
      await register({ nombre: form.nombre, correo: form.correo, contrasena: form.contrasena })
      navigate('/login', { replace: true })
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Error al registrar')
    }
  }

  const sendCode = async () => {
    if (!form.correo.trim()) {
      setErrors((e) => ({ ...e, correo: 'Ingresa un correo' }))
      return
    }
    setEmailStatus({ sent: false, verified: false, loading: true, message: '' })
    try {
      await requestEmailVerification(form.correo)
      setEmailStatus({ sent: true, verified: false, loading: false, message: 'Código enviado. Revisa tu correo.' })
    } catch (err) {
      setEmailStatus({ sent: false, verified: false, loading: false, message: err?.response?.data?.message || 'No se pudo enviar el código' })
    }
  }

  const verifyCode = async () => {
    const code = form.codigo?.trim()
    if (!code) {
      setErrors((e) => ({ ...e, codigo: 'Ingresa el código' }))
      return
    }
    setEmailStatus((s) => ({ ...s, loading: true, message: '' }))
    try {
      await verifyEmailVerification(form.correo, code)
      setEmailStatus({ sent: true, verified: true, loading: false, message: 'Correo verificado ✅' })
    } catch (err) {
      setEmailStatus({ sent: true, verified: false, loading: false, message: err?.response?.data?.message || 'Código inválido' })
    }
  }

  return (
    <div className="register-page">
      <motion.div 
        className="register-container"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.form 
          className="register-form"
          onSubmit={handleSubmit}
          noValidate
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1 className="register-title">Crear Cuenta</h1>

          <label htmlFor="nombre">Nombre completo</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            placeholder="Ej: María López"
            value={form.nombre}
            onChange={handleChange}
            className={errors.nombre ? 'input-error' : ''}
          />
          {errors.nombre && <p className="error-message">{errors.nombre}</p>}

          <label htmlFor="correo">Correo electrónico</label>
          <div className="inline-row">
            <input
              type="email"
              id="correo"
              name="correo"
              placeholder="ejemplo@correo.com"
              value={form.correo}
              onChange={handleChange}
              className={errors.correo ? 'input-error' : ''}
              disabled={emailStatus.verified}
            />
            <button type="button" className="verify-btn" onClick={sendCode} disabled={emailStatus.loading || emailStatus.verified}>
              {emailStatus.loading ? 'Enviando…' : emailStatus.sent ? 'Reenviar' : 'Verificar'}
            </button>
          </div>
          {errors.correo && <p className="error-message">{errors.correo}</p>}
          {emailStatus.message && <p className="status-message">{emailStatus.message}</p>}

          {emailStatus.sent && !emailStatus.verified && (
            <>
              <label htmlFor="codigo">Código de verificación</label>
              <div className="inline-row">
                <input
                  type="text"
                  id="codigo"
                  name="codigo"
                  placeholder="Ingresa el código"
                  value={form.codigo || ''}
                  onChange={handleChange}
                  className={errors.codigo ? 'input-error' : ''}
                />
                <button type="button" className="verify-btn" onClick={verifyCode} disabled={emailStatus.loading}>Verificar</button>
              </div>
              {errors.codigo && <p className="error-message">{errors.codigo}</p>}
            </>
          )}

          <label htmlFor="contrasena">Contraseña</label>
          <input
            type="password"
            id="contrasena"
            name="contrasena"
            placeholder="••••••••"
            value={form.contrasena}
            onChange={handleChange}
            className={errors.contrasena ? 'input-error' : ''}
          />
          {errors.contrasena && <p className="error-message">{errors.contrasena}</p>}

          <label htmlFor="contrasena2">Confirmar contraseña</label>
          <input
            type="password"
            id="contrasena2"
            name="contrasena2"
            placeholder="••••••••"
            value={form.contrasena2}
            onChange={handleChange}
            className={errors.contrasena2 ? 'input-error' : ''}
          />
          {errors.contrasena2 && <p className="error-message">{errors.contrasena2}</p>}

          {submitError && <p className="error-message">{submitError}</p>}
          
          <motion.button 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }} 
            type="submit" 
            className="register-submit"
          >
            Registrarse
          </motion.button>
          <p className="register-switch">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </motion.form>
      </motion.div>
    </div>
  )
}
