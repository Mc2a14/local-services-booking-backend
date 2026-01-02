const config = require('../config');
const businessInfoService = require('./businessInfoService');
const serviceService = require('./serviceService');
const availabilityService = require('./availabilityService');
const faqService = require('./faqService');
const { query } = require('../db');

// Validate OpenAI API key
const validateOpenAIKey = () => {
  if (!config.openaiApiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  return true;
};

// Format availability schedule into readable business hours
const formatBusinessHours = (availability) => {
  if (!availability || availability.length === 0) {
    return null;
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hoursByDay = {};

  // Group hours by day
  availability.forEach(slot => {
    if (slot.is_available) {
      const dayName = days[slot.day_of_week];
      if (!hoursByDay[dayName]) {
        hoursByDay[dayName] = [];
      }
      hoursByDay[dayName].push(`${slot.start_time} - ${slot.end_time}`);
    }
  });

  // Format as readable string
  let hoursText = '';
  Object.keys(hoursByDay).forEach(day => {
    hoursText += `${day}: ${hoursByDay[day].join(', ')}\n`;
  });

  return hoursText.trim();
};

// Get business context for AI
const getBusinessContext = async (providerId, businessSlug = null) => {
  try {
    const businessInfo = await businessInfoService.getBusinessInfoForAI(providerId);
    
    // Get provider's user_id and business_slug to fetch availability (availability uses user_id, not provider UUID)
    const providerResult = await query('SELECT user_id, business_slug FROM providers WHERE id = $1', [providerId]);
    const userId = providerResult.rows[0]?.user_id;
    const slug = businessSlug || providerResult.rows[0]?.business_slug;
    
    const services = await serviceService.getServicesByProviderId(userId);
    const availability = userId ? await availabilityService.getAvailability(userId) : [];
    const faqs = await faqService.getFAQsByProviderId(providerId, true); // Get active FAQs only

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
    
    // Add business hours - prioritize availability schedule, fallback to business_info
    const formattedHours = formatBusinessHours(availability);
    if (formattedHours) {
      context += `Business Hours:\n${formattedHours}\n`;
    } else if (businessInfo.business_hours) {
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
    
    if (slug) {
      context += `\nBooking Information:\n`;
      context += `This is the business's official booking website. Customers can book appointments directly on this page by selecting a service from the list above.\n`;
      context += `Online booking through this website is the preferred and easiest method for customers to schedule appointments.\n`;
    }

    // Add FAQs to context
    if (faqs.length > 0) {
      context += faqService.formatFAQsForAI(faqs);
    }

    return context;
  } catch (error) {
    console.error('Error building business context:', error);
    return 'Business information is not available.';
  }
};

// Simple language detection based on common patterns
const detectLanguage = (text) => {
  if (!text || typeof text !== 'string') return 'en';
  
  const lowerText = text.toLowerCase().trim();
  
  // Spanish indicators - expanded list
  const spanishWords = [
    'si', 'sí', 'por', 'para', 'con', 'del', 'las', 'los', 'una', 'uno', 
    'este', 'esta', 'muy', 'más', 'también', 'puede', 'puedo', 'quiero', 
    'necesito', 'ayuda', 'hijo', 'hija', 'curso', 'clase', 'horario', 
    'disponible', 'reservar', 'agendar', 'está', 'están', 'son', 'tiene', 
    'tienen', 'hay', 'fue', 'será', 'mi', 'tu', 'su', 'sus', 'nuestro', 
    'nuestra', 'cuando', 'donde', 'como', 'que', 'cual', 'cuales', 'quien',
    'aun', 'aún', 'atrasado', 'todavía', 'pueden', 'ser', 'estar', 'hacer'
  ];
  
  // French indicators
  const frenchWords = [
    'oui', 'non', 'pour', 'avec', 'dans', 'sur', 'sous', 'très', 'plus', 
    'aussi', 'peut', 'veux', 'besoin', 'aide', 'enfant', 'cours', 'horaire', 
    'disponible', 'réserver', 'cette', 'cet', 'ces', 'leur', 'leurs'
  ];
  
  // Portuguese indicators
  const portugueseWords = [
    'sim', 'não', 'para', 'com', 'por', 'muito', 'mais', 'também', 'pode', 
    'quer', 'precisa', 'ajuda', 'filho', 'filha', 'curso', 'horário', 
    'disponível', 'reservar', 'agendar', 'está', 'são', 'tem', 'tem', 'foi'
  ];
  
  // Check for Spanish characters
  const hasSpanishChars = /[áéíóúñüÁÉÍÓÚÑÜ]/.test(text);
  
  // Check for Spanish words
  const spanishWordMatches = spanishWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  }).length;
  
  // Check for French characters
  const hasFrenchChars = /[àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/.test(text);
  
  // Check for French words
  const frenchWordMatches = frenchWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  }).length;
  
  // Check for Portuguese characters
  const hasPortugueseChars = /[áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]/.test(text);
  
  // Check for Portuguese words
  const portugueseWordMatches = portugueseWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  }).length;
  
  // Prioritize character detection (most reliable)
  if (hasSpanishChars || spanishWordMatches >= 2) return 'es';
  if (hasFrenchChars || frenchWordMatches >= 2) return 'fr';
  if (hasPortugueseChars || portugueseWordMatches >= 2) return 'pt';
  
  // Fallback to word matching
  if (spanishWordMatches > 0 && spanishWordMatches >= frenchWordMatches && spanishWordMatches >= portugueseWordMatches) return 'es';
  if (frenchWordMatches > 0 && frenchWordMatches >= portugueseWordMatches) return 'fr';
  if (portugueseWordMatches > 0) return 'pt';
  
  return 'en'; // Default to English
};

// Generate AI response using OpenAI
const generateAIResponse = async (question, providerId, businessSlug = null, language = 'en') => {
  validateOpenAIKey();

  try {
    // Use provided language, or detect from question if not provided
    const customerLanguage = language || detectLanguage(question);
    console.log(`[AI Service] Question: "${question.substring(0, 100)}" | Language: ${customerLanguage} (${language ? 'provided' : 'detected'})`);
    
    // Get business context
    const context = await getBusinessContext(providerId, businessSlug);

    // Get current date/time for context
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const currentHour24 = now.getHours();
    const currentDayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday

    // Language-specific instructions - make it VERY explicit
    const languageNames = {
      'es': 'Spanish (Español)',
      'fr': 'French (Français)',
      'pt': 'Portuguese (Português)',
      'en': 'English'
    };
    
    const languageInstructions = {
      'es': `CRITICAL LANGUAGE REQUIREMENT: 
The customer's question is in SPANISH (Español). 
You MUST respond ONLY in SPANISH. 
- Use Spanish grammar, vocabulary, and sentence structure
- Do NOT translate your response to English
- Do NOT mix languages
- Respond entirely in Spanish`,
      'fr': `CRITICAL LANGUAGE REQUIREMENT:
The customer's question is in FRENCH (Français).
You MUST respond ONLY in FRENCH.
- Use French grammar, vocabulary, and sentence structure
- Do NOT translate your response to English
- Do NOT mix languages
- Respond entirely in French`,
      'pt': `CRITICAL LANGUAGE REQUIREMENT:
The customer's question is in PORTUGUESE (Português).
You MUST respond ONLY in PORTUGUESE.
- Use Portuguese grammar, vocabulary, and sentence structure
- Do NOT translate your response to English
- Do NOT mix languages
- Respond entirely in Portuguese`,
      'en': `CRITICAL LANGUAGE REQUIREMENT:
The customer's question is in ENGLISH.
You MUST respond ONLY in ENGLISH.
- Use proper English grammar and vocabulary
- Respond entirely in English`
    };

    // Prepare the prompt
    const systemPrompt = `You are a helpful customer service assistant for a local business. 
Answer customer questions based on the business information provided below. 
Be friendly, concise, and accurate.

${languageInstructions[customerLanguage] || languageInstructions['en']}

IMPORTANT FORMATTING RULES:
- Do NOT repeat or echo the customer's question in your response
- Do NOT start your response with "Customer Question:" or similar phrases
- Provide only the answer directly, as if you're responding naturally in a conversation
- Example: Instead of "Customer Question: What are your hours? Answer: We're open 9am-5pm", just say "We're open 9am-5pm"

CRITICAL INSTRUCTIONS FOR BOOKING APPOINTMENTS:
- When customers ask how to book an appointment, schedule a service, or make a booking, ALWAYS direct them to book through THIS website (the page they are currently on)
- Tell them they can book by selecting a service from the list shown on this page
- Explain that online booking through this website is the preferred and easiest method
- Refer to "this website" or "this page" when talking about booking - this IS the business's official booking website
- Only mention calling the business as a secondary option if they need immediate assistance or have special requests
- Do NOT suggest calling as the primary way to book appointments

CRITICAL INSTRUCTIONS FOR TIME AND HOURS:
- Business hours are provided in 24-hour format (e.g., 09:00 means 9:00 AM, 17:00 means 5:00 PM)
- 11am = 11:00 in 24-hour format
- 11pm = 23:00 in 24-hour format
- When checking if a time is within business hours, convert AM/PM to 24-hour format for comparison
- Example: If hours are 09:00-17:00, then 11am (11:00) IS within business hours
- Always check the Business Hours section to determine if a requested time falls within operating hours
- When asked about availability at a specific time, check if that time is within the business hours for that day

If you don't know the answer based on the provided information, politely say so and suggest they contact the business directly.
Always be professional and helpful.`;

    const userPrompt = `Current Date and Time Context:
Today is: ${currentDate}
Current time is: ${currentTime} (${currentHour24}:${String(now.getMinutes()).padStart(2, '0')} in 24-hour format)
Current day of week: ${currentDayOfWeek} (0=Sunday, 6=Saturday)

Business Information:
${context}

Customer Question (${languageNames[customerLanguage]}): ${question}

⚠️ MANDATORY LANGUAGE REQUIREMENT ⚠️
- DETECTED LANGUAGE: ${languageNames[customerLanguage]}
- You MUST respond in ${languageNames[customerLanguage]} ONLY
- Every word of your response must be in ${languageNames[customerLanguage]}
- Do NOT use English or any other language
- If the customer asked in Spanish, respond entirely in Spanish
- If the customer asked in French, respond entirely in French
- If the customer asked in Portuguese, respond entirely in Portuguese
- Do NOT translate, do NOT switch languages, do NOT mix languages

IMPORTANT: When answering about availability or whether the business is open at a specific time:
1. Convert the requested time to 24-hour format (e.g., 11am = 11:00, 2pm = 14:00, 11pm = 23:00)
2. Check if that time falls within the Business Hours for the relevant day
3. If yes, confirm the business is open at that time
4. If no, explain when the business is actually open

Provide your answer NOW in ${languageNames[customerLanguage]}, without repeating the customer's question.`;

    // Log context for debugging (remove in production if needed)
    console.log('AI Context being sent:', context.substring(0, 500) + '...');

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

// Generate AI response for Atencio marketing site (business owners asking about Atencio)
const generateAtencioAIResponse = async (message, language = 'en') => {
  validateOpenAIKey();

  try {
    // Load knowledge base from JSON file
    const fs = require('fs');
    const path = require('path');
    const knowledgePath = path.join(__dirname, '../ai/atencioKnowledge.json');
    const knowledgeData = fs.readFileSync(knowledgePath, 'utf8');
    const atencioKnowledge = JSON.parse(knowledgeData);
    
    // Build knowledge context from the knowledge base
    let knowledgeContext = `COMPANY INFORMATION:\n`;
    knowledgeContext += `Name: ${atencioKnowledge.brand.name}\n`;
    knowledgeContext += `Tagline: ${atencioKnowledge.brand.tagline}\n`;
    knowledgeContext += `Description: ${atencioKnowledge.brand.description}\n`;
    knowledgeContext += `Value Proposition: ${atencioKnowledge.brand.valueProposition}\n\n`;
    
    knowledgeContext += `WHO IT'S FOR:\n${atencioKnowledge.whoItsFor}\n\n`;
    knowledgeContext += `WHAT IT DOES:\n${atencioKnowledge.whatItDoes}\n\n`;

    if (atencioKnowledge.keyBenefits && atencioKnowledge.keyBenefits.length > 0) {
      knowledgeContext += `KEY BENEFITS & FEATURES:\n`;
      atencioKnowledge.keyBenefits.forEach((benefit, index) => {
        knowledgeContext += `${index + 1}. ${benefit.title}: ${benefit.description}\n`;
      });
      knowledgeContext += `\n`;
    }

    if (atencioKnowledge.onboardingSteps.length > 0) {
      knowledgeContext += `ONBOARDING STEPS:\n`;
      atencioKnowledge.onboardingSteps.forEach((step) => {
        knowledgeContext += `Step ${step.step}: ${step.title} - ${step.description}\n`;
      });
      knowledgeContext += `\n`;
    }

    // Add pricing information
    knowledgeContext += `PRICING:\n`;
    if (atencioKnowledge.pricing.freeTrial) {
      knowledgeContext += `Free Trial: ${atencioKnowledge.pricing.freeTrial}\n`;
    }
    if (atencioKnowledge.pricing.plans && atencioKnowledge.pricing.plans.length > 0) {
      atencioKnowledge.pricing.plans.forEach((plan) => {
        knowledgeContext += `${plan.plan || plan.name}: ${plan.price}\n`;
        if (plan.description) {
          knowledgeContext += `  ${plan.description}\n`;
        }
        if (plan.features && plan.features.length > 0) {
          plan.features.forEach(feature => {
            knowledgeContext += `  - ${feature}\n`;
          });
        }
      });
    }
    if (atencioKnowledge.pricing.pricingNotes) {
      knowledgeContext += `Note: ${atencioKnowledge.pricing.pricingNotes}\n`;
    }
    knowledgeContext += `\n`;

    if (atencioKnowledge.faqs && atencioKnowledge.faqs.length > 0) {
      knowledgeContext += `FREQUENTLY ASKED QUESTIONS:\n`;
      atencioKnowledge.faqs.forEach((faq) => {
        knowledgeContext += `Q: ${faq.question}\n`;
        knowledgeContext += `A: ${faq.answer}\n\n`;
      });
    }
    
    // Add AI tone guidelines
    if (atencioKnowledge.aiTone) {
      knowledgeContext += `AI TONE & PERSONALITY:\n`;
      knowledgeContext += `Personality: ${atencioKnowledge.aiTone.personality}\n`;
      if (atencioKnowledge.aiTone.guidelines && atencioKnowledge.aiTone.guidelines.length > 0) {
        knowledgeContext += `Guidelines:\n`;
        atencioKnowledge.aiTone.guidelines.forEach(guideline => {
          knowledgeContext += `- ${guideline}\n`;
        });
      }
      knowledgeContext += `\n`;
    }

    // Language-specific instructions
    const languageNames = {
      'es': 'Spanish (Español)',
      'fr': 'French (Français)',
      'pt': 'Portuguese (Português)',
      'en': 'English'
    };

    const languageInstructions = {
      'es': `CRITICAL LANGUAGE REQUIREMENT: 
The user's question is in SPANISH (Español). 
You MUST respond ONLY in SPANISH. 
- Use Spanish grammar, vocabulary, and sentence structure
- Do NOT translate your response to English
- Do NOT mix languages
- Respond entirely in Spanish`,
      'fr': `CRITICAL LANGUAGE REQUIREMENT:
The user's question is in FRENCH (Français).
You MUST respond ONLY in FRENCH.
- Use French grammar, vocabulary, and sentence structure
- Do NOT translate your response to English
- Do NOT mix languages
- Respond entirely in French`,
      'pt': `CRITICAL LANGUAGE REQUIREMENT:
The user's question is in PORTUGUESE (Português).
You MUST respond ONLY in PORTUGUESE.
- Use Portuguese grammar, vocabulary, and sentence structure
- Do NOT translate your response to English
- Do NOT mix languages
- Respond entirely in Portuguese`,
      'en': `CRITICAL LANGUAGE REQUIREMENT:
The user's question is in ENGLISH.
You MUST respond ONLY in ENGLISH.
- Use proper English grammar and vocabulary
- Respond entirely in English`
    };

    // Prepare the system prompt
    const systemPrompt = `You are Atencio, a friendly and helpful AI assistant for the Atencio booking platform. 
You help business owners understand how Atencio works, its features, onboarding process, and benefits.

${languageInstructions[language] || languageInstructions['en']}

IMPORTANT RULES:
1. ONLY answer questions related to Atencio (the booking platform, features, setup, pricing, etc.)
2. If asked about unrelated topics, politely redirect: "I can help with questions about Atencio bookings and AI customer service."
3. Be friendly, professional, and concise (keep answers short and clear)
4. Use simple, non-technical language (business owners are not technical)
5. When relevant, include clear call-to-actions (e.g., "Want help setting this up? Sign up to get started!")
6. Do NOT make up information - only use what's provided in the knowledge base below
7. If pricing information is not fully defined in the knowledge base, refer to the pricing notes provided
8. Follow the AI tone and personality guidelines provided in the knowledge base
9. Never hallucinate features or pricing - if something isn't in the knowledge base, politely say you don't have that information or redirect to what Atencio does offer

KNOWLEDGE BASE:
${knowledgeContext}`;

    const userPrompt = `User Question (${languageNames[language]}): ${message}

⚠️ MANDATORY LANGUAGE REQUIREMENT ⚠️
- DETECTED LANGUAGE: ${languageNames[language]}
- You MUST respond in ${languageNames[language]} ONLY
- Every word of your response must be in ${languageNames[language]}
- Do NOT use English or any other language
- Do NOT translate, do NOT switch languages, do NOT mix languages

Provide your answer NOW in ${languageNames[language]}, without repeating the user's question.`;

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
        max_tokens: 300,
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
    console.error('Atencio AI error:', error);
    throw error;
  }
};

module.exports = {
  generateAIResponse,
  generateAtencioAIResponse,
  validateOpenAIKey
};


