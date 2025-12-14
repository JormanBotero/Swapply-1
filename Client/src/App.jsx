// client/src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import PublishProduct from './pages/PublishProduct'
import EditProduct from './pages/EditProduct' // ← Agrega esta importación


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/publish" element={<PublishProduct />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/products/edit/:id" element={<EditProduct />} /> {/* ← Agrega esta ruta */}
      {/* Agregaremos más tarde */}
      {/* <Route path="/chat" element={<Chat />} /> */}
      {/* <Route path="/chat/:id" element={<ChatRoom />} /> */}
    </Routes>
  )
}

export default App