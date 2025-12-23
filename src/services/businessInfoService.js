const { query } = require('../db');

// Create or update business info
const upsertBusinessInfo = async (providerId, businessInfoData) => {
  const { business_hours, location_details, policies, other_info } = businessInfoData;

  // Check if business info already exists
  const existing = await query('SELECT id FROM business_info WHERE provider_id = $1', [providerId]);

  let result;
  if (existing.rows.length > 0) {
    // Update existing
    result = await query(
      `UPDATE business_info 
       SET business_hours = COALESCE($1, business_hours),
           location_details = COALESCE($2, location_details),
           policies = COALESCE($3, policies),
           other_info = COALESCE($4, other_info),
           updated_at = CURRENT_TIMESTAMP
       WHERE provider_id = $5
       RETURNING *`,
      [business_hours || null, location_details || null, policies || null, other_info || null, providerId]
    );
  } else {
    // Insert new
    result = await query(
      `INSERT INTO business_info (provider_id, business_hours, location_details, policies, other_info)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [providerId, business_hours || null, location_details || null, policies || null, other_info || null]
    );
  }

  return result.rows[0];
};

// Get business info by provider ID
const getBusinessInfoByProviderId = async (providerId) => {
  const result = await query(
    'SELECT * FROM business_info WHERE provider_id = $1',
    [providerId]
  );

  if (result.rows.length === 0) {
    return null; // Return null if not found (not an error)
  }

  return result.rows[0];
};

// Get business info for AI context (includes provider details)
const getBusinessInfoForAI = async (providerId) => {
  const result = await query(
    `SELECT 
       p.business_name,
       p.description as business_description,
       p.phone,
       p.address,
       bi.business_hours,
       bi.location_details,
       bi.policies,
       bi.other_info
     FROM providers p
     LEFT JOIN business_info bi ON p.id = bi.provider_id
     WHERE p.id = $1`,
    [providerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Provider not found');
  }

  return result.rows[0];
};

module.exports = {
  upsertBusinessInfo,
  getBusinessInfoByProviderId,
  getBusinessInfoForAI
};

