const providerService = require('../services/providerService');

// Create a new provider
const createProvider = async (req, res) => {
  try {
    const { business_name, description, phone, address, email_password, email_service_type, business_slug, booking_enabled, inquiry_collection_enabled } = req.body;

    // Validation
    if (!business_name) {
      return res.status(400).json({ error: 'business_name is required' });
    }

    // Email password is optional - if not provided, emails won't be sent (just logged)
    // If provided, we'll use it to send emails from their account

    const provider = await providerService.createProvider(req.user.id, {
      business_name,
      description,
      phone,
      address,
      email_password, // App password for their email (Gmail App Password, etc.)
      email_service_type: email_service_type || 'gmail', // Default to Gmail
      business_slug, // Optional - will be auto-generated from business_name if not provided
      booking_enabled: booking_enabled !== undefined ? booking_enabled : true, // Default to true
      inquiry_collection_enabled: inquiry_collection_enabled !== undefined ? inquiry_collection_enabled : true // Default to true
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
    const { business_name, description, phone, address, email_password, email_service_type, business_slug, business_image_url, booking_enabled, inquiry_collection_enabled } = req.body;

    const provider = await providerService.updateProvider(req.user.id, {
      business_name,
      description,
      phone,
      address,
      email_password, // Can update email password if needed
      email_service_type,
      business_slug, // Allow updating slug
      business_image_url, // Allow updating business image
      booking_enabled, // Allow updating booking enabled flag
      inquiry_collection_enabled // Allow updating inquiry collection enabled flag
    });

    res.json({
      message: 'Provider updated successfully',
      provider
    });
  } catch (error) {
    console.error('Update provider error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('User ID:', req.user.id);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: error.message });
    }
    
    // Return detailed error for debugging
    const errorResponse = {
      error: error.message || 'Internal server error'
    };
    
    // Include stack trace in response for debugging (remove in production if needed)
    if (error.stack) {
      errorResponse.stack = error.stack.split('\n').slice(0, 5).join('\n'); // First 5 lines
    }
    
    res.status(500).json(errorResponse);
  }
};

// Update provider email configuration
const updateEmailConfig = async (req, res) => {
  try {
    const { 
      email_service_type,
      email_smtp_host, 
      email_smtp_port, 
      email_smtp_secure,
      email_smtp_user, 
      email_smtp_password, 
      email_from_address,
      email_from_name 
    } = req.body;

    // Validation
    if (email_service_type && !['smtp', 'gmail', 'sendgrid'].includes(email_service_type)) {
      return res.status(400).json({ error: 'email_service_type must be smtp, gmail, or sendgrid' });
    }

    const provider = await providerService.updateProviderEmailConfig(req.user.id, {
      email_service_type,
      email_smtp_host,
      email_smtp_port,
      email_smtp_secure,
      email_smtp_user,
      email_smtp_password,
      email_from_address,
      email_from_name
    });

    res.json({
      message: 'Email configuration updated successfully',
      provider
    });
  } catch (error) {
    console.error('Update email config error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get provider email configuration
const getEmailConfig = async (req, res) => {
  try {
    const config = await providerService.getProviderEmailConfig(req.user.id);

    res.json({ email_config: config });
  } catch (error) {
    console.error('Get email config error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createProvider,
  getMyProvider,
  updateMyProvider,
  updateEmailConfig,
  getEmailConfig
};



