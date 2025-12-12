import React from 'react'

const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '',
  ...props 
}) => {
  // Mapeo de variantes a las clases CSS existentes
  const variantClasses = {
    primary: 'primary-button',
    secondary: 'secondary-button',
    outline: 'secondary-button' // outline usa los mismos estilos que secondary
  }

  const classes = `${variantClasses[variant]} ${className}`

  return (
    <button 
      className={classes}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button