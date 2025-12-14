// client/src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header' // ← Importa el Header
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import PublishProduct from './pages/PublishProduct'
import EditProduct from './pages/EditProduct'
import Chat from './pages/Chat'
import ChatRoom from './pages/ChatRoom'
import Dashboard from './pages/Dashboard'
import './App.css' // Asegúrate de tener este archivo

function App() {
  return (
    <div className="app">
      {/* HEADER - Aparece en todas las páginas */}
      <Header />
      
      {/* Contenido principal que cambia con las rutas */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/publish" element={<PublishProduct />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/edit/:id" element={<EditProduct />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<ChatRoom />} />
        </Routes>
      </main>
    </div>
  )
}

export default App