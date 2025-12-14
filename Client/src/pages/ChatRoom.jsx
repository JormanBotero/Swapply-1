// client/src/pages/ChatRoom.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMessages, sendMessage } from '../services/chat';
import { getConversations } from '../services/chat';
import { me } from '../services/auth';
import { initSocket, joinChat, leaveChat, sendMessageViaSocket } from '../services/socket';
import './ChatRoom.css';

function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchData();
    setupSocket();
    
    return () => {
      // Limpiar al desmontar
      if (socket) {
        leaveChat(id);
      }
    };
  }, [id]);

  useEffect(() => {
    // Desplazarse al final cuando hay nuevos mensajes
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener usuario actual
      const userData = await me();
      setUser(userData);
      
      // Obtener todas las conversaciones para encontrar esta
      const conversations = await getConversations();
      const currentConv = conversations.find(c => c.id === parseInt(id));
      
      if (!currentConv) {
        alert('Conversación no encontrada');
        navigate('/chat');
        return;
      }
      
      setConversation(currentConv);
      
      // Obtener mensajes
      const messagesData = await getMessages(id);
      setMessages(messagesData);
      
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socketInstance = initSocket();
    setSocket(socketInstance);
    
    // Unirse a la sala de chat
    joinChat(id);
    
    // Escuchar nuevos mensajes
    socketInstance.on('new-message', (message) => {
      if (message.conversationId === parseInt(id)) {
        setMessages(prev => [...prev, message]);
      }
    });
    
    // Escuchar notificaciones
    socketInstance.on('message-notification', (notification) => {
      console.log('Nueva notificación:', notification);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    // Mensaje optimista (se muestra inmediatamente)
    const tempMessage = {
      id: Date.now(),
      conversation_id: parseInt(id),
      sender_id: user.id,
      sender_name: user.nombre,
      sender_picture: user.picture,
      content: messageContent,
      created_at: new Date().toISOString(),
      read: false
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setSending(true);
    
    try {
      // Enviar a través de WebSocket (tiempo real)
      const socketSent = sendMessageViaSocket({
        conversationId: id,
        senderId: user.id,
        content: messageContent
      });
      
      // También enviar a la API REST para persistencia
      if (!socketSent) {
        await sendMessage(id, messageContent);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Podrías mostrar un error al usuario aquí
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (loading) {
    return (
      <div className="chat-room-page">
        <div className="loading-chat">
          <div className="spinner"></div>
          <p>Cargando conversación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-room-page">
      {/* Header de la conversación */}
      <div className="chat-header-room">
        <Link to="/chat" className="back-button">
          ←
        </Link>
        
        <div className="chat-partner-info">
          <div className="partner-avatar">
            {conversation?.other_user_picture ? (
              <img 
                src={conversation.other_user_picture} 
                alt={conversation.other_user_name} 
              />
            ) : (
              <div className="avatar-placeholder">
                {conversation?.other_user_name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          
          <div className="partner-details">
            <h2>{conversation?.other_user_name || 'Usuario'}</h2>
            {conversation?.product_title && (
              <p className="product-context">
                Sobre: {conversation.product_title}
              </p>
            )}
          </div>
        </div>
        
        {conversation?.product_id && (
          <Link 
            to={`/products/${conversation.product_id}`}
            className="view-product-btn"
          >
            Ver Producto
          </Link>
        )}
      </div>

      {/* Área de mensajes */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>¡Inicia la conversación! 👋</p>
            <p className="hint">
              Coordina los detalles del intercambio de manera segura
            </p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const showAvatar = index === 0 || 
                messages[index - 1]?.sender_id !== message.sender_id;
              
              return (
                <div 
                  key={message.id} 
                  className={`message-wrapper ${isOwn ? 'own' : 'other'}`}
                >
                  {!isOwn && showAvatar && (
                    <div className="message-avatar">
                      {message.sender_picture ? (
                        <img src={message.sender_picture} alt={message.sender_name} />
                      ) : (
                        <div className="avatar-small">
                          {message.sender_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="message-bubble-container">
                    {!isOwn && showAvatar && (
                      <div className="sender-name">{message.sender_name}</div>
                    )}
                    
                    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                      <p>{message.content}</p>
                      <span className="message-time">
                        {new Date(message.created_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input para enviar mensajes */}
      <form className="message-input-form" onSubmit={handleSendMessage}>
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            rows="1"
            disabled={sending}
            className="message-input"
          />
          
          <button 
            type="submit" 
            className="send-button"
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <div className="send-spinner"></div>
            ) : (
              'Enviar'
            )}
          </button>
        </div>
        
        <div className="input-hint">
          Presiona Enter para enviar, Shift+Enter para nueva línea
        </div>
      </form>
    </div>
  );
}

export default ChatRoom;