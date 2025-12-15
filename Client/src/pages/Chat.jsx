// client/src/pages/Chat.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getConversations } from '../services/chat';
import { me } from '../services/auth';
import './Chat.css';

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserAndConversations();
  }, []);

  const fetchUserAndConversations = async () => {
    try {
      setLoading(true);
      const userData = await me();
      setUser(userData);
      
      const convos = await getConversations();
      setConversations(convos);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} d`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className="chat-page">
        <div className="loading-chat">
          <div className="spinner"></div>
          <p>Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        <header className="chat-header">
          <h1>Mensajes</h1>
          <p>Gestiona tus conversaciones de intercambio</p>
        </header>

        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="no-conversations">
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>No tienes conversaciones aún</h3>
                <p>Cuando alguien muestre interés en tus productos o tú en los de otros, aparecerán aquí.</p>
                <Link to="/products" className="browse-products-btn">
                  Explorar Productos
                </Link>
              </div>
            </div>
          ) : (
            conversations.map(conversation => (
              <Link 
                to={`/chat/${conversation.id}`} 
                key={conversation.id}
                className="conversation-item"
              >
                <div className="conversation-avatar">
                  {conversation.other_user_picture ? (
                    <img 
                      src={conversation.other_user_picture} 
                      alt={conversation.other_user_name} 
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {conversation.other_user_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                
                <div className="conversation-info">
                  <div className="conversation-header">
                    <h3>{conversation.other_user_name || 'Usuario'}</h3>
                    <span className="conversation-time">
                      {formatLastMessageTime(conversation.updated_at)}
                    </span>
                  </div>
                  
                  <p className="conversation-preview">
                    {conversation.last_message || 'Nuevo chat'}
                  </p>
                  
                  {conversation.product_title && (
                    <div className="conversation-product">
                      <span className="product-badge">
                        📦 {conversation.product_title}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Indicador de mensajes no leídos (si los hubiera) */}
                {/* <div className="unread-badge">3</div> */}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;