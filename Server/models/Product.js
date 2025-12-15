// server/models/Product.js
import { query } from '../config/db.js';

export async function createProduct({ 
  title, 
  description, 
  category, 
  condition = 'nuevo', 
  images = [], 
  owner_id, 
  location = '', 
  status = 'available' 
}) {
  const res = await query(
    `INSERT INTO products
    (title, description, category, condition, images, owner_id, location, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     RETURNING *`,
    [title, description, category, condition, images, owner_id, location, status]
  );
  return res.rows[0];
}

export async function findProducts(filters = {}) {
  let sql = `
    SELECT p.*, u.nombre as owner_name, u.picture as owner_picture 
    FROM products p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE 1=1
  `;
  const values = [];
  let idx = 1;

  if (filters.category && filters.category !== '') {
    sql += ` AND p.category = $${idx++}`;
    values.push(filters.category);
  }
  
  if (filters.status && filters.status !== '') {
    sql += ` AND p.status = $${idx++}`;
    values.push(filters.status);
  }
  
  if (filters.owner_id) {
    sql += ` AND p.owner_id = $${idx++}`;
    values.push(filters.owner_id);
  }
  
  
  if (filters.search && filters.search !== '') {
    sql += ` AND (p.title ILIKE $${idx++} OR p.description ILIKE $${idx})`;
    values.push(`%${filters.search}%`);
    idx++;
  }

  sql += ' ORDER BY p.created_at DESC';
  
  const res = await query(sql, values);
  return res.rows;
}

export async function findProductById(id) {
  const res = await query(
    `SELECT p.*, u.nombre as owner_name, u.picture as owner_picture
     FROM products p
     LEFT JOIN users u ON p.owner_id = u.id
     WHERE p.id = $1`,
    [id]
  );
  return res.rows[0] || null;
}

export async function updateProduct(id, updates = {}) {
  const fields = [];
  const values = [];
  let idx = 1;

  const allowedFields = ['title', 'description', 'category', 'condition', 'images', 'location', 'status'];
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return await findProductById(id);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
}

export async function updateProductStatus(id, status) {
  const res = await query(
    `UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return res.rows[0];
}

export async function deleteProduct(id, owner_id) {
  const res = await query(
    `DELETE FROM products WHERE id = $1 AND owner_id = $2 RETURNING *`,
    [id, owner_id]
  );
  return res.rows[0];
}