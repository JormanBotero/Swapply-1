// server/models/Conversation.js
import { query } from '../config/db.js';

export async function findOrCreateConversation(user1_id, user2_id, product_id = null) {
  // Buscar conversación existente
  const existing = await query(
    `SELECT * FROM conversations 
     WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1))
     AND (product_id = $3 OR (product_id IS NULL AND $3 IS NULL))
     LIMIT 1`,
    [user1_id, user2_id, product_id]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  // Crear nueva conversación
  const res = await query(
    `INSERT INTO conversations (user1_id, user2_id, product_id, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     RETURNING *`,
    [user1_id, user2_id, product_id]
  );
  return res.rows[0];
}

export async function findUserConversations(user_id) {
  const res = await query(
    `SELECT c.*, 
            CASE 
              WHEN c.user1_id = $1 THEN u2.nombre
              ELSE u1.nombre
            END as other_user_name,
            CASE 
              WHEN c.user1_id = $1 THEN u2.picture
              ELSE u1.picture
            END as other_user_picture,
            p.title as product_title,
            p.images as product_images,
            p.id as product_id
     FROM conversations c
     LEFT JOIN users u1 ON c.user1_id = u1.id
     LEFT JOIN users u2 ON c.user2_id = u2.id
     LEFT JOIN products p ON c.product_id = p.id
     WHERE c.user1_id = $1 OR c.user2_id = $1
     ORDER BY c.updated_at DESC`,
    [user_id]
  );
  return res.rows;
}

export async function updateConversationLastMessage(conversation_id, last_message) {
  await query(
    `UPDATE conversations 
     SET last_message = $1, updated_at = NOW()
     WHERE id = $2`,
    [last_message, conversation_id]
  );
}