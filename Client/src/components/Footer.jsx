import SwapllyLogo from '../assets/react.svg'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-bottom">
        <div className="footer-container">
          
          {/* Brand */}
          <div className="footer-column brand">
            <img
              src={SwapllyLogo}
              alt="Logo Swaplly"
              className="footer-logo"
            />
            <h3>Swaplly</h3>
            <p>
              El trueque correcto
              <br />
              con la persona correcta
            </p>
          </div>

          {/* Navegación */}
          <div className="footer-column">
            <h4>Navegación</h4>
            <ul>
              <li><a href="/">Inicio</a></li>
              <li><a href="/register">Regístrate</a></li>
              <li><a href="/login">Iniciar sesión</a></li>
            </ul>
          </div>

          {/* Ayuda */}
          <div className="footer-column">
            <h4>Ayuda</h4>
            <ul>
              <li>
                <a
                  href="https://wa.me/3053194385"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Soporte
                </a>
              </li>
              <li><a href="/faq">Preguntas Frecuentes</a></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="footer-copyright">
          <p>&copy; 2024 Swaplly. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
