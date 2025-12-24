const providerService = require('../services/providerService');
const serviceService = require('../services/serviceService');
const reviewService = require('../services/reviewService');

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

    res.json({
      business: {
        id: provider.id,
        business_name: provider.business_name,
        business_slug: provider.business_slug,
        description: provider.description,
        phone: provider.phone,
        address: provider.address,
        owner_name: provider.owner_name
      },
      services: servicesWithRatings
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

