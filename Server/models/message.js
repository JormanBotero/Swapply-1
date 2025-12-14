// server/models/Message.js
import { query } from '../config/db.js';

export async function createMessage({ conversation_id, sender_id, content }) {
  const res = await query(
    `INSERT INTO messages (conversation_id, sender_id, content, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [conversation_id, sender_id, content]
  );

  // Actualizar última actividad de la conversación
  await query(
    `UPDATE conversations 
     SET last_message = $1, updated_at = NOW()
     WHERE id = $2`,
    [content.length > 100 ? content.substring(0, 100) + '...' : content, conversation_id]
  );

  return res.rows[0];
}

export async function findMessagesByConversation(conversation_id, limit = 50) {
  const res = await query(
    `SELECT m.*, u.nombre as sender_name, u.picture as sender_picture
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at ASC
     LIMIT $2`,
    [conversation_id, limit]
  );
  return res.rows;
}

export async function markMessagesAsRead(conversation_id, user_id) {
  await query(
    `UPDATE messages 
     SET read = true
     WHERE conversation_id = $1 AND sender_id != $2 AND read = false`,
    [conversation_id, user_id]
  );
}