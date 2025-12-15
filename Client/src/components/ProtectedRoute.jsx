import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Mientras se carga la info del usuario, muestra un spinner
    return <div className="loading-spinner">Cargando...</div>;
  }

  if (!user) {
    // Redirige al login y guarda la ruta original para volver después
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
