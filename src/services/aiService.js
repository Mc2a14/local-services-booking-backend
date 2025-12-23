const config = require('../config');
const businessInfoService = require('./businessInfoService');
const serviceService = require('./serviceService');
const { query } = require('../db');

// Validate OpenAI API key
const validateOpenAIKey = () => {
  if (!config.openaiApiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  return true;
};

// Get business context for AI
const getBusinessContext = async (providerId) => {
  try {
    const businessInfo = await businessInfoService.getBusinessInfoForAI(providerId);
    const services = await serviceService.getServicesByProviderId(providerId);

    // Build context string
    let context = `Business Information:\n`;
    context += `Business Name: ${businessInfo.business_name}\n`;
    if (businessInfo.business_description) {
      context += `Description: ${businessInfo.business_description}\n`;
    }
    if (businessInfo.phone) {
      context += `Phone: ${businessInfo.phone}\n`;
    }
    if (businessInfo.address) {
      context += `Address: ${businessInfo.address}\n`;
    }
    if (businessInfo.business_hours) {
      context += `Business Hours: ${businessInfo.business_hours}\n`;
    }
    if (businessInfo.location_details) {
      context += `Location Details: ${businessInfo.location_details}\n`;
    }
    if (businessInfo.policies) {
      context += `Policies: ${businessInfo.policies}\n`;
    }
    if (businessInfo.other_info) {
      context += `Additional Information: ${businessInfo.other_info}\n`;
    }

    if (services.length > 0) {
      context += `\nAvailable Services:\n`;
      services.forEach((service, index) => {
        if (service.is_active) {
          context += `${index + 1}. ${service.title}`;
          if (service.description) context += ` - ${service.description}`;
          context += ` - $${service.price}`;
          if (service.duration_minutes) context += ` (${service.duration_minutes} minutes)`;
          context += `\n`;
        }
      });
    }

    return context;
  } catch (error) {
    console.error('Error building business context:', error);
    return 'Business information is not available.';
  }
};

// Generate AI response using OpenAI
const generateAIResponse = async (question, providerId) => {
  validateOpenAIKey();

  try {
    // Get business context
    const context = await getBusinessContext(providerId);

    // Prepare the prompt
    const systemPrompt = `You are a helpful customer service assistant for a local business. 
Answer customer questions based on the business information provided. 
Be friendly, concise, and accurate. 
If you don't know the answer based on the provided information, politely say so and suggest they contact the business directly.
Always be professional and helpful.`;

    const userPrompt = `Business Information:
${context}

Customer Question: ${question}

Please provide a helpful answer based on the business information above.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};

module.exports = {
  generateAIResponse,
  validateOpenAIKey
};


