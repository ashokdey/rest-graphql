import humps from 'humps';
import bcrypt from 'bcrypt';

import { writePool, readPool } from '../../db/mysql';

export async function getAllUsersService({ search, limit, offset }) {
  let getQuery = 'SELECT * FROM users u';
  const values = [];

  if (search) {
    getQuery += ` WHERE u.name LIKE "%${search}%" `;
    // values.push(search);
  }

  if (limit && (offset || offset === 0)) {
    getQuery += ' LIMIT ? OFFSET ?';
    values.push(parseInt(limit, 10), parseInt(offset, 10));
  }

  const result = await readPool.query(getQuery, values);
  return humps.camelizeKeys(result[0]);
}

// TODO : can be refactored into a common service accepting table name and resourceId
export async function getResourceDetails({ userId }) {
  const query = 'SELECT * FROM users WHERE id = ?';
  const result = await readPool.query(query, [userId]);
  if (result.length) {
    return humps.camelizeKeys(result[0][0]);
  }
  return {};
}

export async function createUsersService({
  name, email, mobile, imageUrl = '', password,
}) {
  // hash the password
  const hash = await bcrypt.hash(password, 10);

  const result = await writePool.query(
    'INSERT INTO users (name, email, mobile, image_url) VALUES (?, ?, ?, ?)',
    [name, email, mobile, imageUrl],
  );
  if (!result[0].affectedRows) {
    return {};
  }

  const userId = result[0].insertId;

  await writePool.query(
    'INSERT INTO users_details (user_id, password) VALUES (?, ?)',
    [userId, hash],
  );

  return {
    id: userId,
    name,
    email,
    mobile,
    imageUrl,
  };
}

export async function updateUsersService({
  userId, name, email, city, imageUrl,
}) {
  let updateQuery = 'UPDATE users SET';
  const updates = [];
  const updateValues = [];

  if (name) {
    updates.push(' name = ? ');
    updateValues.push(name);
  }

  if (email) {
    updates.push(' email = ? ');
    updateValues.push(email);
  }

  if (city) {
    updates.push(' city = ? ');
    updateValues.push(city);
  }

  if (imageUrl) {
    updates.push(' image_url = ? ');
    updateValues.push(imageUrl);
  }

  updateQuery = `${updateQuery} ${updates.join()}  WHERE id = ?`;
  await writePool.query(updateQuery, [...updateValues, userId]);
  const updatedUser = await getResourceDetails({ userId });
  return updatedUser;
}

export async function deleteUsersService({ userIdCollection }) {
  if (!Array.isArray(userIdCollection)) return;
  await writePool.query('UPDATE users SET is_active = 0 WHERE id IN (?)', [userIdCollection]);
}

export async function reviewsOfUsers({ userId, limit, offset }) {
  let query = 'SELECT * FROM product_reviews WHERE user_id =? ';
  const values = [userId];

  if (limit && (offset || offset === 0)) {
    query += ' LIMIT ? OFFSET ?';
    values.push(parseInt(limit, 10), parseInt(offset, 10));
  }
  const result = await readPool.query(query, values);
  return humps.camelizeKeys(result[0]);
}
