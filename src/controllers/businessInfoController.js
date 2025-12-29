const businessInfoService = require('../services/businessInfoService');
const providerService = require('../services/providerService');

// Create or update business info (provider only)
const upsertBusinessInfo = async (req, res) => {
  try {
    const { business_hours, location_details, policies, other_info } = req.body;

    // Get provider
    const provider = await providerService.getProviderByUserId(req.user.id);
    
    const businessInfo = await businessInfoService.upsertBusinessInfo(provider.id, {
      business_hours,
      location_details,
      policies,
      other_info
    });

    res.json({
      message: 'Business info saved successfully',
      businessInfo
    });
  } catch (error) {
    console.error('Upsert business info error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current provider's business info
const getMyBusinessInfo = async (req, res) => {
  try {
    const provider = await providerService.getProviderByUserId(req.user.id);
    const businessInfo = await businessInfoService.getBusinessInfoByProviderId(provider.id);

    if (!businessInfo) {
      return res.json({ businessInfo: null, message: 'No business info set up yet' });
    }

    res.json({ businessInfo });
  } catch (error) {
    console.error('Get business info error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  upsertBusinessInfo,
  getMyBusinessInfo
};



