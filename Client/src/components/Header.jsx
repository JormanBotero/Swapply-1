// client/src/components/Header.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { me, logoutUser } from '../services/auth';
import './Header.css';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const checkAuth = async () => {
    try {
      const userData = await me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleProtectedLinkClick = (e, path) => {
    if (!user) {
      e.preventDefault();
      navigate('/login', { state: { from: path } });
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (loading) {
    return (
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-icon">🔄</span>
            <span className="logo-text">Swapply</span>
          </div>
          <div className="loading-spinner"></div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="header">
        <div className="header-container">
          {/* Logo */}
          <Link to="/" className="logo">
            <span className="logo-icon">🔄</span>
            <span className="logo-text">Swapply</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            <div className="nav-links">
              <NavLink 
                to={user ? "/products" : "#"}
                isActive={isActive('/products')}
                onClick={(e) => !user && handleProtectedLinkClick(e, '/products')}
                text="Productos"
                requiresLogin={!user}
              />
              
              <NavLink 
                to={user ? "/products/publish" : "#"}
                isActive={isActive('/products/publish')}
                onClick={(e) => !user && handleProtectedLinkClick(e, '/products/publish')}
                text="Publicar"
                requiresLogin={!user}
              />
              
              <NavLink 
                to={user ? "/chat" : "#"}
                isActive={isActive('/chat')}
                onClick={(e) => !user && handleProtectedLinkClick(e, '/chat')}
                text="Chat"
                requiresLogin={!user}
                isChat={true}
              />
            </div>

            {/* User Section */}
            <div className="user-section">
              {user ? (
                <div className="user-profile">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.picture ? (
                        <img src={user.picture} alt={user.nombre} />
                      ) : (
                        <span className="avatar-placeholder">
                          {user.nombre?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <span className="user-name">Hola, {user.nombre}</span>
                  </div>
                  <button onClick={handleLogout} className="logout-btn">
                    Salir
                  </button>
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link 
                    to="/login" 
                    className={`auth-btn login-btn ${isActive('/login') ? 'active' : ''}`}
                  >
                    Iniciar Sesión
                  </Link>
                  
                  <Link 
                    to="/register" 
                    className="auth-btn register-btn"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Menú"
          >
            <span className="menu-line"></span>
            <span className="menu-line"></span>
            <span className="menu-line"></span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={toggleMobileMenu}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            <div className="mobile-header">
              <div className="mobile-logo">
                <span className="logo-icon">🔄</span>
                <span className="logo-text">Swapply</span>
              </div>
              <button className="close-menu-btn" onClick={toggleMobileMenu}>
                ✕
              </button>
            </div>

            <div className="mobile-nav-links">
              <MobileNavLink 
                to={user ? "/products" : "#"}
                onClick={(e) => !user && handleProtectedLinkClick(e, '/products')}
                text="Productos"
                requiresLogin={!user}
              />
              
              <MobileNavLink 
                to={user ? "/products/publish" : "#"}
                onClick={(e) => !user && handleProtectedLinkClick(e, '/products/publish')}
                text="Publicar"
                requiresLogin={!user}
              />
              
              <MobileNavLink 
                to={user ? "/chat" : "#"}
                onClick={(e) => !user && handleProtectedLinkClick(e, '/chat')}
                text="Chat"
                requiresLogin={!user}
                isChat={true}
              />
            </div>

            <div className="mobile-user-section">
              {user ? (
                <>
                  <div className="mobile-user-info">
                    <div className="user-avatar">
                      {user.picture ? (
                        <img src={user.picture} alt={user.nombre} />
                      ) : (
                        <span className="avatar-placeholder">
                          {user.nombre?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="mobile-user-details">
                      <span className="user-name">{user.nombre}</span>
                      <span className="user-email">{user.correo}</span>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="mobile-logout-btn">
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <div className="mobile-auth-buttons">
                  <Link 
                    to="/login" 
                    className="mobile-auth-btn login-btn"
                    onClick={toggleMobileMenu}
                  >
                    Iniciar Sesión
                  </Link>
                  
                  <Link 
                    to="/register" 
                    className="mobile-auth-btn register-btn"
                    onClick={toggleMobileMenu}
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ to, isActive, onClick, text, requiresLogin, isChat }) {
  return (
    <Link 
      to={to}
      className={`nav-link ${isActive ? 'active' : ''} ${isChat ? 'chat-link' : ''} ${requiresLogin ? 'requires-login' : ''}`}
      onClick={onClick}
    >
      <span className="nav-text">{text}</span>
      {requiresLogin && <span className="login-indicator">🔒</span>}
    </Link>
  );
}

function MobileNavLink({ to, onClick, text, requiresLogin, isChat }) {
  return (
    <Link 
      to={to}
      className={`mobile-nav-link ${isChat ? 'chat-link' : ''} ${requiresLogin ? 'requires-login' : ''}`}
      onClick={onClick}
    >
      <span className="nav-text">{text}</span>
      {requiresLogin && <span className="login-indicator">🔒</span>}
    </Link>
  );
}

export default Header;