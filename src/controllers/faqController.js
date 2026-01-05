const faqService = require('../services/faqService');
const providerService = require('../services/providerService');

// Get all FAQs for the logged-in provider
const getMyFAQs = async (req, res) => {
  try {
    const provider = await providerService.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    const faqs = await faqService.getFAQsByProviderId(provider.id);
    res.json({ faqs });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ error: error.message || 'Failed to get FAQs' });
  }
};

// Create a new FAQ
const createFAQ = async (req, res) => {
  try {
    const provider = await providerService.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    const { question, answer, display_order, is_active } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const faq = await faqService.createFAQ(provider.id, {
      question,
      answer,
      display_order,
      is_active
    });

    res.status(201).json({ faq });
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ error: error.message || 'Failed to create FAQ' });
  }
};

// Update an FAQ
const updateFAQ = async (req, res) => {
  try {
    const provider = await providerService.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    const { id } = req.params;
    const { question, answer, display_order, is_active } = req.body;

    const faq = await faqService.updateFAQ(id, provider.id, {
      question,
      answer,
      display_order,
      is_active
    });

    res.json({ faq });
  } catch (error) {
    console.error('Update FAQ error:', error);
    if (error.message === 'FAQ not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to update FAQ' });
  }
};

// Delete an FAQ
const deleteFAQ = async (req, res) => {
  try {
    const provider = await providerService.getProviderByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }

    const { id } = req.params;
    await faqService.deleteFAQ(id, provider.id);

    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    if (error.message === 'FAQ not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to delete FAQ' });
  }
};

module.exports = {
  getMyFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ
};





