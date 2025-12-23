const { query } = require('../db');

// Create a new provider
const createProvider = async (userId, providerData) => {
  const { business_name, description, phone, address } = providerData;

  // Check if user already has a provider
  const existingProvider = await query('SELECT id FROM providers WHERE user_id = $1', [userId]);
  if (existingProvider.rows.length > 0) {
    throw new Error('User already has a provider profile');
  }

  // Insert provider
  const result = await query(
    'INSERT INTO providers (user_id, business_name, description, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, business_name, description, phone, address, created_at',
    [userId, business_name, description || null, phone || null, address || null]
  );

  return result.rows[0];
};

// Get provider by user ID
const getProviderByUserId = async (userId) => {
  const result = await query(
    'SELECT id, user_id, business_name, description, phone, address, created_at FROM providers WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Provider not found');
  }

  return result.rows[0];
};

// Update provider by user ID
const updateProvider = async (userId, providerData) => {
  const { business_name, description, phone, address } = providerData;

  const result = await query(
    'UPDATE providers SET business_name = COALESCE($1, business_name), description = COALESCE($2, description), phone = COALESCE($3, phone), address = COALESCE($4, address) WHERE user_id = $5 RETURNING id, user_id, business_name, description, phone, address, created_at',
    [business_name || null, description || null, phone || null, address || null, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Provider not found');
  }

  return result.rows[0];
};

module.exports = {
  createProvider,
  getProviderByUserId,
  updateProvider
};


