const { query } = require('../db');
const { encrypt } = require('../utils/encryption');

// Generate a unique slug from business name
const generateSlug = async (businessName) => {
  // Convert to lowercase, replace spaces with dashes, remove special chars
  let baseSlug = businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50); // Limit length

  // Ensure it's not empty
  if (!baseSlug) {
    baseSlug = 'business-' + Date.now();
  }

  // Check if slug exists, if so add number
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await query('SELECT id FROM providers WHERE business_slug = $1', [slug]);
    if (existing.rows.length === 0) {
      break;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Create a new provider
const createProvider = async (userId, providerData) => {
  const { business_name, description, phone, address, email_password, email_service_type, business_slug, business_image_url, booking_enabled, inquiry_collection_enabled } = providerData;

  // Get user's email address
  const userResult = await query('SELECT email, full_name FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  const userEmail = userResult.rows[0].email;

  // Check if user already has a provider
  const existingProvider = await query('SELECT id FROM providers WHERE user_id = $1', [userId]);
  if (existingProvider.rows.length > 0) {
    throw new Error('User already has a provider profile');
  }

  // Generate or use provided slug
  let slug = business_slug;
  if (!slug) {
    slug = await generateSlug(business_name);
  } else {
    // Validate provided slug is available
    const existing = await query('SELECT id FROM providers WHERE business_slug = $1', [slug]);
    if (existing.rows.length > 0) {
      throw new Error('This business URL is already taken. Please choose another.');
    }
  }

  // Encrypt email password if provided
  let encryptedPassword = null;
  if (email_password) {
    encryptedPassword = encrypt(email_password);
  }

  // Determine email service type (default to gmail if password provided)
  const serviceType = email_service_type || (email_password ? 'gmail' : null);

  // Insert provider with email configuration and slug
  const result = await query(
    `INSERT INTO providers (user_id, business_name, business_slug, description, phone, address, business_image_url,
     email_service_type, email_smtp_user, email_smtp_password_encrypted, 
     email_from_address, email_from_name, booking_enabled, inquiry_collection_enabled) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
     RETURNING id, user_id, business_name, business_slug, description, phone, address, business_image_url, booking_enabled, inquiry_collection_enabled, created_at`,
    [
      userId, 
      business_name,
      slug,
      description || null, 
      phone || null, 
      address || null,
      business_image_url || null,
      serviceType,
      email_password ? userEmail : null,
      encryptedPassword,
      userEmail,
      business_name,
      booking_enabled !== undefined ? booking_enabled : true,
      inquiry_collection_enabled !== undefined ? inquiry_collection_enabled : true
    ]
  );

  return result.rows[0];
};

// Get provider by user ID
const getProviderByUserId = async (userId) => {
  const result = await query(
    'SELECT id, user_id, business_name, business_slug, description, phone, address, business_image_url, booking_enabled, inquiry_collection_enabled, created_at FROM providers WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Provider not found');
  }

  return result.rows[0];
};

// Get provider by business slug (for public booking pages)
const getProviderBySlug = async (slug) => {
  const result = await query(
    `SELECT p.*, u.email, u.full_name as owner_name 
     FROM providers p
     JOIN users u ON p.user_id = u.id
     WHERE p.business_slug = $1`,
    [slug]
  );

  if (result.rows.length === 0) {
    throw new Error('Business not found');
  }

  return result.rows[0];
};

// Update provider by user ID
const updateProvider = async (userId, providerData) => {
  const { business_name, description, phone, address, email_password, email_service_type, business_slug, business_image_url, booking_enabled, inquiry_collection_enabled } = providerData;

  // Get user's email
  const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  const userEmail = userResult.rows[0].email;
  
  if (!userEmail) {
    throw new Error('User email not found');
  }

  // Get current provider to check if business_name changed
  const currentProviderResult = await query('SELECT business_name, business_slug FROM providers WHERE user_id = $1', [userId]);
  if (currentProviderResult.rows.length === 0) {
    throw new Error('Provider not found');
  }
  const currentProvider = currentProviderResult.rows[0];

  // Encrypt password if provided
  let encryptedPassword = null;
  if (email_password && email_password.trim()) {
    try {
      encryptedPassword = encrypt(email_password.trim());
    } catch (error) {
      console.error('Password encryption error:', error);
      throw new Error('Failed to encrypt email password. Please try again.');
    }
  }

  // Determine the slug to use
  // Get the business name that will be used (either the new one or keep current)
  const newBusinessName = business_name && business_name.trim() ? business_name.trim() : currentProvider.business_name;
  
  // Determine if slug was explicitly changed by user (different from current)
  const slugExplicitlyChanged = business_slug !== undefined && business_slug !== null && business_slug !== '' && business_slug !== currentProvider.business_slug;
  
  let finalSlug;
  
  // If business_name is being updated and it's different from current name, auto-generate new slug
  if (business_name && business_name.trim() && business_name.trim() !== currentProvider.business_name) {
    finalSlug = await generateSlug(business_name.trim());
  }
  // If slug was explicitly changed by user, validate it doesn't conflict
  else if (slugExplicitlyChanged) {
    const existing = await query('SELECT id FROM providers WHERE business_slug = $1 AND user_id != $2', [business_slug, userId]);
    if (existing.rows.length > 0) {
      throw new Error('This business URL is already taken. Please choose another.');
    }
    finalSlug = business_slug;
  }
  // Otherwise, check if current slug matches what it should be based on business name
  // (This handles cases where business name was changed before slug auto-update was implemented)
  else if (newBusinessName) {
    // Generate what the slug SHOULD be based on the business name
    let baseSlug = newBusinessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    
    if (!baseSlug) {
      baseSlug = 'business-' + Date.now();
    }
    
    // Check if the current slug matches what it should be
    // If not, generate a new unique slug (excluding current provider's slug from uniqueness check)
    if (currentProvider.business_slug !== baseSlug) {
      // Generate unique slug, but exclude current provider from uniqueness check
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await query('SELECT id FROM providers WHERE business_slug = $1 AND user_id != $2', [slug, userId]);
        if (existing.rows.length === 0) {
          break;
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      finalSlug = slug;
    } else {
      finalSlug = currentProvider.business_slug;
    }
  } else {
    finalSlug = currentProvider.business_slug;
  }

  // Build update query - conditionally update email config only if password is provided
  try {
    // Cast encryptedPassword to TEXT explicitly so PostgreSQL knows the type
    const hasEmailPassword = encryptedPassword !== null;
    
    const result = await query(
      `UPDATE providers 
       SET business_name = COALESCE($1, business_name), 
           description = COALESCE($2, description), 
           phone = COALESCE($3, phone), 
           address = COALESCE($4, address),
           business_slug = COALESCE($5::VARCHAR, business_slug),
           business_image_url = COALESCE($6, business_image_url),
           booking_enabled = CASE WHEN $13 IS NOT NULL THEN $13::BOOLEAN ELSE booking_enabled END,
           inquiry_collection_enabled = CASE WHEN $14 IS NOT NULL THEN $14::BOOLEAN ELSE inquiry_collection_enabled END,
           email_service_type = CASE WHEN $9::TEXT IS NOT NULL THEN COALESCE($7, email_service_type) ELSE email_service_type END,
           email_smtp_user = CASE WHEN $9::TEXT IS NOT NULL THEN COALESCE($8, email_smtp_user) ELSE email_smtp_user END,
           email_smtp_password_encrypted = CASE WHEN $9::TEXT IS NOT NULL THEN COALESCE($9::TEXT, email_smtp_password_encrypted) ELSE email_smtp_password_encrypted END,
           email_from_address = CASE WHEN $9::TEXT IS NOT NULL THEN COALESCE($10, email_from_address) ELSE email_from_address END,
           email_from_name = CASE WHEN $9::TEXT IS NOT NULL THEN COALESCE($11, email_from_name) ELSE email_from_name END
       WHERE user_id = $12 
       RETURNING id, user_id, business_name, business_slug, description, phone, address, business_image_url, booking_enabled, inquiry_collection_enabled, created_at`,
      [
        business_name || null, 
        description || null, 
        phone || null, 
        address || null,
        finalSlug || null,
        business_image_url || null,
        email_service_type || (hasEmailPassword ? 'gmail' : null),
        hasEmailPassword ? userEmail : null,
        encryptedPassword,
        hasEmailPassword ? userEmail : null,
        hasEmailPassword ? (business_name || null) : null,
        userId,
        booking_enabled !== undefined ? booking_enabled : null,
        inquiry_collection_enabled !== undefined ? inquiry_collection_enabled : null
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Provider not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('SQL Update error:', error);
    console.error('Update parameters:', {
      business_name,
      email_service_type,
      hasEmailPassword: !!email_password,
      userId,
      userEmail
    });
    throw error;
  }
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
  getProviderBySlug,
  updateProvider,
  updateProviderEmailConfig,
  getProviderEmailConfig,
  generateSlug
};



