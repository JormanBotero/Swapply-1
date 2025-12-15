import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import PublishProduct from './pages/PublishProduct';
import EditProduct from './pages/EditProduct';
import Chat from './pages/Chat';
import ChatRoom from './pages/ChatRoom';
import ProtectedRoute from './components/ProtectedRoute'; // Asegúrate de que existe este archivo


function App() {
  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <Routes>
          {/* Rutas públicas (acceso sin login) */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas (requieren login) - ENVUELVE CADA UNA CON ProtectedRoute */}
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          
          <Route path="/products/publish" element={
            <ProtectedRoute>
              <PublishProduct />
            </ProtectedRoute>
          } />
          
          <Route path="/products/:id" element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/products/edit/:id" element={
            <ProtectedRoute>
              <EditProduct />
            </ProtectedRoute>
          } />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          
          <Route path="/chat/:id" element={
            <ProtectedRoute>
              <ChatRoom />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;