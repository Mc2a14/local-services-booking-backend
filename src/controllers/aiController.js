const aiService = require('../services/aiService');
const providerService = require('../services/providerService');

// Handle AI chat question
const chat = async (req, res) => {
  try {
    const { question, provider_id } = req.body;

    // Validation
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    if (!provider_id) {
      return res.status(400).json({ error: 'provider_id is required' });
    }

    // Verify provider exists and get provider UUID
    let provider;
    try {
      provider = await providerService.getProviderByUserId(provider_id);
    } catch (error) {
      if (error.message === 'Provider not found') {
        return res.status(404).json({ error: 'Provider not found' });
      }
      throw error;
    }

    // Generate AI response (use provider.id which is the UUID)
    const response = await aiService.generateAIResponse(question, provider.id);

    res.json({
      question,
      response,
      provider_id
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

module.exports = {
  chat
};

