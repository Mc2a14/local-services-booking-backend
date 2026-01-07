const { query } = require('../db');
const providerService = require('./providerService');
const emailService = require('./emailService');

// Create a new customer inquiry
const createInquiry = async (providerId, inquiryData) => {
  const { customer_name, customer_email, customer_phone, inquiry_message } = inquiryData;

  // Validate that at least one contact method is provided
  if (!customer_name && !customer_email && !customer_phone && !inquiry_message) {
    throw new Error('At least one field (name, email, phone, or message) must be provided');
  }

  // Verify provider exists
  const providerResult = await query('SELECT id, business_name, user_id FROM providers WHERE id = $1', [providerId]);
  if (providerResult.rows.length === 0) {
    throw new Error('Provider not found');
  }

  const provider = providerResult.rows[0];

  // Insert inquiry
  const result = await query(
    `INSERT INTO customer_inquiries 
     (provider_id, customer_name, customer_email, customer_phone, inquiry_message, status) 
     VALUES ($1, $2, $3, $4, $5, 'new') 
     RETURNING *`,
    [
      providerId,
      customer_name || null,
      customer_email || null,
      customer_phone || null,
      inquiry_message || null
    ]
  );

  const inquiry = result.rows[0];

  // Send email notification to business owner (async, don't wait for it)
  try {
    // Get provider's email config for sending notification
    const providerWithConfig = await providerService.getProviderByUserId(provider.user_id);
    
    // Get business owner's email
    const userResult = await query('SELECT email, full_name FROM users WHERE id = $1', [provider.user_id]);
    const businessOwnerEmail = userResult.rows[0]?.email;

    if (businessOwnerEmail) {
      // Send notification email (fire and forget)
      emailService.sendInquiryNotification(inquiry, provider.business_name, businessOwnerEmail, providerWithConfig)
        .catch(err => {
          console.error('Failed to send inquiry notification email:', err);
          // Don't throw - inquiry was saved successfully
        });
    }
  } catch (error) {
    console.error('Error sending inquiry notification:', error);
    // Don't fail the inquiry creation if email fails
  }

  return inquiry;
};

// Get all inquiries for a provider
const getInquiriesByProvider = async (providerId, status = null) => {
  let queryText = `
    SELECT id, provider_id, customer_name, customer_email, customer_phone, 
           inquiry_message, status, created_at, updated_at
    FROM customer_inquiries
    WHERE provider_id = $1
  `;
  
  const params = [providerId];
  
  if (status) {
    queryText += ' AND status = $2';
    params.push(status);
  }
  
  queryText += ' ORDER BY created_at DESC';
  
  const result = await query(queryText, params);
  return result.rows;
};

// Update inquiry status
const updateInquiryStatus = async (inquiryId, providerId, status) => {
  // Validate status
  if (!['new', 'contacted', 'followed_up'].includes(status)) {
    throw new Error('Invalid status. Must be one of: new, contacted, followed_up');
  }

  // Verify inquiry belongs to provider
  const checkResult = await query(
    'SELECT id FROM customer_inquiries WHERE id = $1 AND provider_id = $2',
    [inquiryId, providerId]
  );

  if (checkResult.rows.length === 0) {
    throw new Error('Inquiry not found or access denied');
  }

  // Update status
  const result = await query(
    `UPDATE customer_inquiries 
     SET status = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 AND provider_id = $3 
     RETURNING *`,
    [status, inquiryId, providerId]
  );

  return result.rows[0];
};

// Get inquiry by ID (for provider)
const getInquiryById = async (inquiryId, providerId) => {
  const result = await query(
    `SELECT id, provider_id, customer_name, customer_email, customer_phone, 
            inquiry_message, status, created_at, updated_at
     FROM customer_inquiries
     WHERE id = $1 AND provider_id = $2`,
    [inquiryId, providerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Inquiry not found or access denied');
  }

  return result.rows[0];
};

module.exports = {
  createInquiry,
  getInquiriesByProvider,
  updateInquiryStatus,
  getInquiryById
};

