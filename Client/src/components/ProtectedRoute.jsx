import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { me } from '../services/auth';

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await me(); // devuelve null si no hay sesión
      setIsAuthenticated(!!user);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div>Cargando...</div>; // loader mientras verifica
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
