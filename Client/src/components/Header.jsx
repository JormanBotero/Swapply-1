// client/src/components/Header.jsx
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          🔄 Swapply
        </Link>
        
        <nav className="nav">
          <Link to="/products" className="nav-item">
            Productos
          </Link>
          <Link to="/products/publish" className="nav-item">
            Publicar
          </Link>
          {/* ENLACE AL CHAT */}
          <Link to="/chat" className="nav-item chat-item">
            💬 Chat
          </Link>
          <Link to="/dashboard" className="nav-item">
            Mi Cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;