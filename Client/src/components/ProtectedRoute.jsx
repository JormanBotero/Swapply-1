import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { me } from '../services/auth';

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await me();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir al login, guardando la página a la que intentaba acceder
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;