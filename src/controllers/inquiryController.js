const inquiryService = require('../services/inquiryService');
const providerService = require('../services/providerService');

// Create a new inquiry (public endpoint - from customer chat)
const createInquiry = async (req, res) => {
  try {
    const { provider_id, business_slug, customer_name, customer_email, customer_phone, inquiry_message } = req.body;

    // Get provider - support both provider_id and business_slug
    let provider;
    try {
      if (business_slug) {
        provider = await providerService.getProviderBySlug(business_slug);
      } else if (provider_id) {
        provider = await providerService.getProviderByUserId(provider_id);
      } else {
        return res.status(400).json({ error: 'Either provider_id or business_slug is required' });
      }
    } catch (error) {
      if (error.message === 'Provider not found' || error.message === 'Business not found') {
        return res.status(404).json({ error: 'Business not found' });
      }
      throw error;
    }

    // Create inquiry
    const inquiry = await inquiryService.createInquiry(provider.id, {
      customer_name,
      customer_email,
      customer_phone,
      inquiry_message
    });

    res.status(201).json({
      success: true,
      message: 'Your information has been received. The business will contact you soon!',
      inquiry: {
        id: inquiry.id,
        created_at: inquiry.created_at
      }
    });
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({ error: error.message || 'Failed to create inquiry' });
  }
};

// Get all inquiries for a provider (authenticated)
const getInquiries = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    // Get provider by user ID
    const provider = await providerService.getProviderByUserId(userId);

    // Get inquiries
    const inquiries = await inquiryService.getInquiriesByProvider(provider.id, status || null);

    res.json({
      inquiries,
      count: inquiries.length
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch inquiries' });
  }
};

// Update inquiry status (authenticated)
const updateInquiryStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { inquiryId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Get provider by user ID
    const provider = await providerService.getProviderByUserId(userId);

    // Update status
    const inquiry = await inquiryService.updateInquiryStatus(inquiryId, provider.id, status);

    res.json({
      success: true,
      inquiry
    });
  } catch (error) {
    console.error('Update inquiry status error:', error);
    
    if (error.message === 'Inquiry not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('Invalid status')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || 'Failed to update inquiry status' });
  }
};

// Get single inquiry (authenticated)
const getInquiry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { inquiryId } = req.params;

    // Get provider by user ID
    const provider = await providerService.getProviderByUserId(userId);

    // Get inquiry
    const inquiry = await inquiryService.getInquiryById(inquiryId, provider.id);

    res.json({ inquiry });
  } catch (error) {
    console.error('Get inquiry error:', error);
    
    if (error.message === 'Inquiry not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || 'Failed to fetch inquiry' });
  }
};

module.exports = {
  createInquiry,
  getInquiries,
  updateInquiryStatus,
  getInquiry
};

