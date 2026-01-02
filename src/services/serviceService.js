const { query } = require('../db');

const reviewService = require('./reviewService');

// Create a new service
const createService = async (providerId, serviceData) => {
  const { title, description, category, price, duration_minutes, image_url } = serviceData;

  // Get the max display_order for this provider and add 1
  const maxOrderResult = await query(
    'SELECT COALESCE(MAX(display_order), -1) as max_order FROM services WHERE provider_id = $1',
    [providerId]
  );
  const displayOrder = (maxOrderResult.rows[0].max_order || -1) + 1;

  const result = await query(
    'INSERT INTO services (provider_id, title, description, category, price, duration_minutes, image_url, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, provider_id, title, description, category, price, duration_minutes, image_url, is_active, display_order, created_at, updated_at',
    [providerId, title, description || null, category || null, price, duration_minutes || null, image_url || null, displayOrder]
  );

  return result.rows[0];
};

// Get service by ID
const getServiceById = async (serviceId) => {
  const result = await query(
    'SELECT s.*, u.full_name as provider_name FROM services s JOIN users u ON s.provider_id = u.id WHERE s.id = $1',
    [serviceId]
  );

  if (result.rows.length === 0) {
    throw new Error('Service not found');
  }

  const service = result.rows[0];
  
  // Get average rating
  const rating = await reviewService.getServiceAverageRating(serviceId);
  service.average_rating = rating.average_rating;
  service.review_count = rating.review_count;

  return service;
};

// Get all services for a provider
const getServicesByProviderId = async (providerId) => {
  const result = await query(
    'SELECT * FROM services WHERE provider_id = $1 ORDER BY display_order ASC, created_at DESC',
    [providerId]
  );

  return result.rows;
};

// Update service
const updateService = async (serviceId, providerId, serviceData) => {
  const { title, description, category, price, duration_minutes, is_active, image_url } = serviceData;

  const result = await query(
    'UPDATE services SET title = COALESCE($1, title), description = COALESCE($2, description), category = COALESCE($3, category), price = COALESCE($4, price), duration_minutes = COALESCE($5, duration_minutes), is_active = COALESCE($6, is_active), image_url = COALESCE($7, image_url), updated_at = CURRENT_TIMESTAMP WHERE id = $8 AND provider_id = $9 RETURNING *',
    [title || null, description || null, category || null, price || null, duration_minutes || null, is_active !== undefined ? is_active : null, image_url || null, serviceId, providerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Service not found or unauthorized');
  }

  return result.rows[0];
};

// Delete service
const deleteService = async (serviceId, providerId) => {
  const result = await query(
    'DELETE FROM services WHERE id = $1 AND provider_id = $2 RETURNING id',
    [serviceId, providerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Service not found or unauthorized');
  }

  return true;
};

// Browse services (for customers) - active services only
const browseServices = async (filters = {}) => {
  const { category, search, limit = 50, offset = 0 } = filters;
  
  let queryText = `
    SELECT s.*, u.full_name as provider_name, p.business_name 
    FROM services s 
    JOIN users u ON s.provider_id = u.id 
    LEFT JOIN providers p ON u.id = p.user_id
    WHERE s.is_active = true
  `;
  const params = [];
  let paramCount = 0;

  if (category) {
    paramCount++;
    queryText += ` AND s.category = $${paramCount}`;
    params.push(category);
  }

  if (search) {
    paramCount++;
    queryText += ` AND (s.title ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  queryText += ` ORDER BY s.display_order ASC, s.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  params.push(limit, offset);

  const result = await query(queryText, params);
  
  // Optimize: Get all ratings in a single query instead of N+1 queries
  if (result.rows.length === 0) {
    return [];
  }
  
  const serviceIds = result.rows.map(s => s.id);
  const { query: dbQuery } = require('../db');
  
  const ratingsResult = await dbQuery(
    `SELECT 
      service_id,
      AVG(rating)::numeric(10,1) as average_rating,
      COUNT(*) as review_count
     FROM reviews
     WHERE service_id = ANY($1::int[])
     GROUP BY service_id`,
    [serviceIds]
  );
  
  // Create a map for quick lookup
  const ratingsMap = new Map();
  ratingsResult.rows.forEach(row => {
    ratingsMap.set(row.service_id, {
      average_rating: row.average_rating,
      review_count: parseInt(row.review_count) || 0
    });
  });
  
  // Add ratings to services
  const servicesWi