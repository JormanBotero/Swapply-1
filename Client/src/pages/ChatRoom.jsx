import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMessages, getConversations } from '../services/chat';
import { me } from '../services/auth';
import {
  initSocket,
  joinChat,
  leaveChat
} from '../services/socket';
import './ChatRoom.css';

function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [user, setUser] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ---------------- INIT ----------------
  useEffect(() => {
    init();
    return cleanup;
  }, [id]);

  // ---------------- SCROLL ----------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---------------- INIT FUNCTION ----------------
  const init = async () => {
    try {
      setLoading(true);

      const userData = await me();
      setUser(userData);

      const conversations = await getConversations();
      const conv = conversations.find(c => c.id === Number(id));

      if (!conv) {
        navigate('/chat');
        return;
      }

      setConversation(conv);

      // ---- MENSAJES (deduplicados) ----
      const msgs = await getMessages(id);
      const uniqueMessages = Array.from(
        new Map(msgs.map(m => [m.id, m])).values()
      );
      setMessages(uniqueMessages);

      // ---- SOCKET ----
      const socket = initSocket();
      socketRef.current = socket;

      joinChat(id);

      socket.on('new-message', (message) => {
        if (message.conversation_id !== Number(id)) return;

        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      });

    } catch (err) {
      console.error('Chat init error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CLEANUP ----------------
  const cleanup = () => {
    if (socketRef.current) {
      leaveChat(id);
      socketRef.current.off('new-message');
    }
  };

  // ---------------- SEND MESSAGE ----------------
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('send-message', {
      conversationId: Number(id),
      content: newMessage.trim()
    });

    setNewMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // ---------------- UI ----------------
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
              const showAvatar =
                index === 0 ||
                messages[index - 1]?.sender_id !== message.sender_id;

              return (
                <div
                  key={message.id}
                  className={`message-wrapper ${isOwn ? 'own' : 'other'}`}
                >
                  {!isOwn && showAvatar && (
                    <div className="message-avatar">
                      {message.sender_picture ? (
                        <img
                          src={message.sender_picture}
                          alt={message.sender_name}
                        />
                      ) : (
                        <div className="avatar-small">
                          {message.sender_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="message-bubble-container">
                    {!isOwn && showAvatar && (
                      <div className="sender-name">
                        {message.sender_name}
                      </div>
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
            className="message-input"
          />

          <button
            type="submit"
            className="send-button"
            disabled={!newMessage.trim()}
          >
            Enviar
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
