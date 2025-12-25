const serviceService = require('../services/serviceService');
const providerService = require('../services/providerService');

// Create a new service (provider only)
const createService = async (req, res) => {
  try {
    const { title, description, category, price, duration_minutes, image_url } = req.body;

    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'title is required' });
    }

    if (price === null || price === undefined || price === '' || isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'price must be a positive number' });
    }

    // Verify provider exists, then create service
    await providerService.getProviderByUserId(req.user.id);
    
    const service = await serviceService.createService(req.user.id, {
      title,
      description,
      category,
      price,
      duration_minutes,
      image_url
    });

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found. Please create a provider profile first.' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all services for current provider
const getMyServices = async (req, res) => {
  try {
    await providerService.getProviderByUserId(req.user.id);
    const services = await serviceService.getServicesByProviderId(req.user.id);

    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single service by ID
const getService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await serviceService.getServiceById(id);

    res.json({ service });
  } catch (error) {
    console.error('Get service error:', error);
    
    if (error.message === 'Service not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update service (provider only)
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, price, duration_minutes, is_active, image_url } = req.body;

    await providerService.getProviderByUserId(req.user.id);
    
    const service = await serviceService.updateService(id, req.user.id, {
      title,
      description,
      category,
      price,
      duration_minutes,
      is_active,
      image_url
    });

    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Update service error:', error);
    
    if (error.message === 'Service not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete service (provider only)
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    await providerService.getProviderByUserId(req.user.id);
    
    await serviceService.deleteService(id, req.user.id);

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    
    if (error.message === 'Service not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Browse services (public - for customers)
const browseServices = async (req, res) => {
  try {
    const { category, search, limit, offset } = req.query;
    
    const services = await serviceService.browseServices({
      category,
      search,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({ services });
  } catch (error) {
    console.error('Browse services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createService,
  getMyServices,
  getService,
  updateService,
  deleteService,
  browseServices
};

