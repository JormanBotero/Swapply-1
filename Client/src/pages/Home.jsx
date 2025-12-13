import { motion } from "framer-motion"
import { FaUserPlus, FaSignInAlt } from "react-icons/fa"
import Footer from "../components/Footer"
import { useNavigate } from "react-router-dom"
import WhySwapply from "../components/WhySwapply"
import Meteors from "../components/Meteors"
import Button from "../components/Button"

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home-container">
      
      {/* HERO SECTION */}
      <section className="hero-section">
        <Meteors number={120} />

        <div className="hero-content">
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Swaplly
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            La plataforma de trueques más confiable para intercambiar productos
            de forma segura, rápida y sin intermediarios.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <Button
              variant="primary"
              onClick={() => navigate("/register")}
            >
              <FaUserPlus className="button-icon" />
              Crear cuenta
            </Button>

            <Button
              variant="secondary"
              onClick={() => navigate("/login")}
            >
              <FaSignInAlt className="button-icon" />
              Iniciar sesión
            </Button>
          </motion.div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <WhySwapply />

      {/* FOOTER */}
      <Footer />
    </div>
  )
}
