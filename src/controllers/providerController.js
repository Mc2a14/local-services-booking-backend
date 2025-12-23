const providerService = require('../services/providerService');

// Create a new provider
const createProvider = async (req, res) => {
  try {
    const { business_name, description, phone, address } = req.body;

    // Validation
    if (!business_name) {
      return res.status(400).json({ error: 'business_name is required' });
    }

    const provider = await providerService.createProvider(req.user.id, {
      business_name,
      description,
      phone,
      address
    });

    res.status(201).json({
      message: 'Provider created successfully',
      provider
    });
  } catch (error) {
    console.error('Create provider error:', error);
    
    if (error.message === 'User already has a provider profile') {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user's provider profile
const getMyProvider = async (req, res) => {
  try {
    const provider = await providerService.getProviderByUserId(req.user.id);

    res.json({ provider });
  } catch (error) {
    console.error('Get provider error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update current user's provider profile
const updateMyProvider = async (req, res) => {
  try {
    const { business_name, description, phone, address } = req.body;

    const provider = await providerService.updateProvider(req.user.id, {
      business_name,
      description,
      phone,
      address
    });

    res.json({
      message: 'Provider updated successfully',
      provider
    });
  } catch (error) {
    console.error('Update provider error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createProvider,
  getMyProvider,
  updateMyProvider
};


