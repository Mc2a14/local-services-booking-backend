const aiService = require('../services/aiService');
const providerService = require('../services/providerService');

// Handle AI chat question
const chat = async (req, res) => {
  try {
    const { question, provider_id, business_slug, language = 'en' } = req.body;

    // Validation
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    // Support both provider_id (for authenticated) and business_slug (for public)
    let provider;
    try {
      if (business_slug) {
        // Public access via business slug
        provider = await providerService.getProviderBySlug(business_slug);
      } else if (provider_id) {
        // Authenticated access via provider user ID
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

    // Generate AI response (use provider.id which is the UUID, pass business_slug for booking context, and language)
    const aiResult = await aiService.generateAIResponse(question, provider.id, provider.business_slug, language);

    res.json({
      question,
      response: aiResult.response,
      shouldCollectInfo: aiResult.shouldCollectInfo || false,
      business_name: provider.business_name
    });
  } catch (error) {
    console.error('AI chat error:', error);
    
    if (error.message === 'OpenAI API key is not configured') {
      return res.status(503).json({ error: 'AI service is not available. OpenAI API key is not configured.' });
    }
    
    if (error.message.includes('OpenAI API error')) {
      return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle Atencio marketing site AI chat (for business owners)
const atencioChat = async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;

    // Validation
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Generate AI response using Atencio knowledge base
    const reply = await aiService.generateAtencioAIResponse(message, language);

    res.json({
      reply
    });
  } catch (error) {
    console.error('Atencio AI chat error:', error);
    
    if (error.message === 'OpenAI API key is not configured') {
      return res.status(503).json({ error: 'AI service is not available. OpenAI API key is not configured.' });
    }
    
    if (error.message.includes('OpenAI API error')) {
      return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  chat,
  atencioChat
};

