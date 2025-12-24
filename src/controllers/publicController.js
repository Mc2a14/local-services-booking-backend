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
    
    // Add ratings to each service
    const servicesWithRatings = await Promise.all(
      activeServices.map(async (service) => {
        const rating = await reviewService.getServiceAverageRating(service.id);
        return {
          ...service,
          average_rating: rating.average_rating,
          review_count: rating.review_count
        };
      })
    );

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
        owner_name: provider.owner_name
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

module.exports = {
  getBusinessBySlug
};

