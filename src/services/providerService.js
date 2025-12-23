const { query } = require('../db');
const { encrypt } = require('../utils/encryption');

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

// Update provider email configuration
const updateProviderEmailConfig = async (userId, emailConfig) => {
  const { 
    email_service_type = 'smtp',
    email_smtp_host, 
    email_smtp_port = 587, 
    email_smtp_secure = false,
    email_smtp_user, 
    email_smtp_password, 
    email_from_address,
    email_from_name 
  } = emailConfig;

  // Encrypt password if provided
  let encryptedPassword = null;
  if (email_smtp_password) {
    encryptedPassword = encrypt(email_smtp_password);
  }

  const result = await query(
    `UPDATE providers 
     SET email_service_type = COALESCE($1, email_service_type),
         email_smtp_host = COALESCE($2, email_smtp_host),
         email_smtp_port = COALESCE($3, email_smtp_port),
         email_smtp_secure = COALESCE($4, email_smtp_secure),
         email_smtp_user = COALESCE($5, email_smtp_user),
         email_smtp_password_encrypted = COALESCE($6, email_smtp_password_encrypted),
         email_from_address = COALESCE($7, email_from_address),
         email_from_name = COALESCE($8, email_from_name)
     WHERE user_id = $9 
     RETURNING id, user_id, business_name, email_service_type, email_smtp_host, email_smtp_port, 
               email_smtp_secure, email_smtp_user, email_from_address, email_from_name`,
    [
      email_service_type || null,
      email_smtp_host || null,
      email_smtp_port || null,
      email_smtp_secure || null,
      email_smtp_user || null,
      encryptedPassword,
      email_from_address || null,
      email_from_name || null,
      userId
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('Provider not found');
  }

  // Don't return encrypted password
  const provider = result.rows[0];
  delete provider.email_smtp_password_encrypted;
  return provider;
};

// Get provider email configuration (without password)
const getProviderEmailConfig = async (userId) => {
  const result = await query(
    `SELECT email_service_type, email_smtp_host, email_smtp_port, email_smtp_secure,
            email_smtp_user, email_from_address, email_from_name
     FROM providers 
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Provider not found');
  }

  return result.rows[0];
};

module.exports = {
  createProvider,
  getProviderByUserId,
  updateProvider,
  updateProviderEmailConfig,
  getProviderEmailConfig
};



