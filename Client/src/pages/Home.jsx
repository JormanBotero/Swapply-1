import { motion } from "framer-motion"
import { FaUserPlus, FaSignInAlt } from "react-icons/fa"
import Footer from "../components/Footer"
import { useNavigate } from 'react-router-dom'
import WhySwapply from "../components/WhySwapply"
import Meteors from "../components/Meteors"
import Button from "../components/Button"

export default function Home() {
  const navigate = useNavigate()
  
  return (
    <div className="home-container"> 
      
      {/* SECTION CON BACKGROUND */}
      <div className="main-section">
        <Meteors number={140} />   
        {/* CONTENIDO PRINCIPAL CON ANIMACIONES */}
        <div className="main-content">
            <motion.h1 
              className="main-title"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Swaplly
            </motion.h1>
            
            <motion.p 
              className="main-description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              La plataforma de trueques más confiable. Conecta con personas 
              interesadas en intercambiar productos de forma segura y sencilla.
            </motion.p>
            
            <motion.div
              className="button-container"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {/* USO CORRECTO - con prop variant */}
              <Button
                variant="primary" 
                onClick={() => navigate('/register')}
              >
                <FaUserPlus className="button-icon" /> 
                Crea tu Cuenta
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => navigate('/login')}
              >
                <FaSignInAlt className="button-icon" /> 
                Iniciar Sesión
              </Button>
            </motion.div>
        </div>
      </div>

      {/* Sección Why Swaplly */}
      <WhySwapply />

      {/* Footer */}
      <Footer />
    </div>
  )
}