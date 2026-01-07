const providerService = require('../services/providerService');
const serviceService = require('../services/serviceService');
const reviewService = require('../services/reviewService');
const { query } = require('../db');

// Get public business page by slug
const getBusinessBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const provider = await providerService.getProviderBySlug(slug);
    
    // Get active services for this provider with ratings
    const services = await serviceService.getServicesByProviderId(provider.user_id);
    const activeServices = services.filter(s => s.is_active);
    
    // Optimize: Get all ratings in a single query instead of N+1 queries
    const serviceIds = activeServices.map(s => s.id);
    let servicesWithRatings = activeServices;
    
    if (serviceIds.length > 0) {
      const ratingsResult = await query(
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
      servicesWithRatings = activeServices.map(service => ({
        ...service,
        average_rating: ratingsMap.get(service.id)?.average_rating || null,
        review_count: ratingsMap.get(service.id)?.review_count || 0
      }));
    }

    // Get recent reviews/testimonials (last 10 reviews)
    const reviewsResult = await query(
      `SELECT r.*, u.full_name as customer_name, s.title as service_title
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       JOIN services s ON r.service_id = s.id
       WHERE r.provider_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [provider.user_id]
    );

    const testimonials = reviewsResult.rows.map(review => ({
      id: review.id,
      customer_name: review.customer_name,
      service_title: review.service_title,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at
    }));

    res.json({
      business: {
        id: provider.id,
        business_name: provider.business_name,
        business_slug: provider.business_slug,
        description: provider.description,
        phone: provider.phone,
        address: provider.address,
        business_image_url: provider.business_image_url,
        owner_name: provider.owner_name,
        booking_enabled: provider.booking_enabled === true || provider.booking_enabled === null || provider.booking_enabled === undefined, // Explicitly check for true or null/undefined (defaults to true)
        inquiry_collection_enabled: provider.inquiry_collection_enabled === true || provider.inquiry_collection_enabled === null || provider.inquiry_collection_enabled === undefined // Explicitly check for true or null/undefined (defaults to true)
      },
      services: servicesWithRatings,
      testimonials: testimonials
    });
  } catch (error) {
    console.error('Get business by slug error:', error);
    
    if (error.message === 'Business not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search businesses by name
const searchBusinesses = async (req, res) => {
  try {
    const { q } = req.query;
    
    // Input validation and sanitization
    if (!q || typeof q !== 'string') {
      return res.json({ businesses: [] });
    }
    
    const trimmedQuery = q.trim();
    
    if (trimmedQuery.length < 2) {
      return res.json({ businesses: [] });
    }
    
    // Prevent SQL injection and limit length
    if (trimmedQuery.length > 100) {
      return res.status(400).json({ error: 'Search query too long' });
    }

    const searchTerm = `%${trimmedQuery.toLowerCase()}%`;
    
    const result = await query(
      `SELECT 
        p.id,
        p.business_name,
        p.business_slug,
        p.description,
        p.phone,
        p.address,
        p.business_image_url,
        u.full_name as owner_name
       FROM providers p
       JOIN users u ON p.user_id = u.id
       WHERE LOWER(p.business_name) LIKE $1
       ORDER BY p.business_name ASC
       LIMIT 10`,
      [searchTerm]
    );

    const businesses = result.rows.map(provider => ({
      id: provider.id,
      business_name: provider.business_name,
      business_slug: provider.business_slug,
      description: provider.description,
      phone: provider.phone,
      address: provider.address,
      business_image_url: provider.business_image_url,
      owner_name: provider.owner_name
    }));

    res.json({ businesses });
  } catch (error) {
    console.error('Search businesses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getBusinessBySlug,
  searchBusinesses
};

