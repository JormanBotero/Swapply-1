import React from 'react'

const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '',
  icon,
  fullWidth = false,
  ...props 
}) => {
  // Mapeo de variantes a las clases CSS existentes
  const variantClasses = {
    primary: 'primary-button',
    secondary: 'secondary-button',
    outline: 'secondary-button'
  }

  // Clases base + variante + fullWidth si es necesario + clases personalizadas
  const baseClasses = `button-base ${variantClasses[variant]}`
  const widthClass = fullWidth ? 'w-full' : ''
  const classes = `${baseClasses} ${widthClass} ${className}`.trim()

  return (
    <button 
      className={classes}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="button-icon">{icon}</span>}
      {children}
    </button>
  )
}

export default Button