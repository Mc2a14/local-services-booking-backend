const { query } = require('../db');

// Create a new FAQ
const createFAQ = async (providerId, faqData) => {
  const { question, answer, display_order, is_active } = faqData;
  
  const result = await query(
    `INSERT INTO faqs (provider_id, question, answer, display_order, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      providerId,
      question,
      answer,
      display_order || 0,
      is_active !== undefined ? is_active : true
    ]
  );

  return result.rows[0];
};

// Get all FAQs for a provider
const getFAQsByProviderId = async (providerId, activeOnly = false) => {
  let sql = 'SELECT * FROM faqs WHERE provider_id = $1';
  const params = [providerId];
  
  if (activeOnly) {
    sql += ' AND is_active = true';
  }
  
  sql += ' ORDER BY display_order, created_at';
  
  const result = await query(sql, params);
  return result.rows;
};

// Get a single FAQ by ID
const getFAQById = async (faqId, providerId) => {
  const result = await query(
    'SELECT * FROM faqs WHERE id = $1 AND provider_id = $2',
    [faqId, providerId]
  );

  if (result.rows.length === 0) {
    throw new Error('FAQ not found');
  }

  return result.rows[0];
};

// Update an FAQ
const updateFAQ = async (faqId, providerId, faqData) => {
  const { question, answer, display_order, is_active } = faqData;
  
  const result = await query(
    `UPDATE faqs 
     SET question = COALESCE($1, question),
         answer = COALESCE($2, answer),
         display_order = COALESCE($3, display_order),
         is_active = COALESCE($4, is_active),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5 AND provider_id = $6
     RETURNING *`,
    [question, answer, display_order, is_active, faqId, providerId]
  );

  if (result.rows.length === 0) {
    throw new Error('FAQ not found');
  }

  return result.rows[0];
};

// Delete an FAQ
const deleteFAQ = async (faqId, providerId) => {
  const result = await query(
    'DELETE FROM faqs WHERE id = $1 AND provider_id = $2 RETURNING *',
    [faqId, providerId]
  );

  if (result.rows.length === 0) {
    throw new Error('FAQ not found');
  }

  return result.rows[0];
};

// Format FAQs for AI context
const formatFAQsForAI = (faqs) => {
  if (!faqs || faqs.length === 0) {
    return '';
  }

  let faqText = '\nFrequently Asked Questions (FAQs):\n';
  faqs.forEach((faq, index) => {
    faqText += `${index + 1}. Q: ${faq.question}\n`;
    faqText += `   A: ${faq.answer}\n\n`;
  });

  return faqText;
};

module.exports = {
  createFAQ,
  getFAQsByProviderId,
  getFAQById,
  updateFAQ,
  deleteFAQ,
  formatFAQsForAI
};



