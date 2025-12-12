import SwapllyLogo from '../assets/react.svg'


export default function Footer() {
  return (
    <footer className="footer">
      <div className="cta-section">
        <h2>¿Listo para empezar a intercambiar?</h2>
        <p>Únete a la comunidad de trueques que ya está transformando la forma de obtener lo que necesitas.</p>
        <div className="cta-buttons">
            <button className="navbar-cta">Empieza Gratis</button>
            <button className="navbar-cta">Soporte</button>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-column brand">
            <img src={SwapllyLogo} alt="Logo Swaplly" className="footer-logo" />
            <h3>Swaplly</h3>
            <p>El trueque correcto<br/>con la persona correcta :)</p>
          </div>

          <div className="footer-column">
            <h4>Navegación</h4>
            <ul>
              <li><a href="/">Inicio</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/register">Regístrate</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Ayuda</h4>
            <ul>
              <li><a href="https://wa.me/3053194385" target='_blank' rel="noopener noreferrer">Soporte</a></li>
              <li><a href="/faq">Preguntas Frecuentes</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-copyright">
          <p>&copy; 2024 Swaplly. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
