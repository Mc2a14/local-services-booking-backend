const config = require('../config');
const businessInfoService = require('./businessInfoService');
const serviceService = require('./serviceService');
const availabilityService = require('./availabilityService');
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

    return context;
  } catch (error) {
    console.error('Error building business context:', error);
    return 'Business information is not available.';
  }
};

// Generate AI response using OpenAI
const generateAIResponse = async (question, providerId, businessSlug = null) => {
  validateOpenAIKey();

  try {
    // Get business context
    const context = await getBusinessContext(providerId, businessSlug);

    // Get current date/time for context
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const currentHour24 = now.getHours();
    const currentDayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday

    // Prepare the prompt
    const systemPrompt = `You are a helpful customer service assistant for a local business. 
Answer customer questions based on the business information provided below. 
Be friendly, concise, and accurate. 

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

Customer Question: ${question}

IMPORTANT: When answering about availability or whether the business is open at a specific time:
1. Convert the requested time to 24-hour format (e.g., 11am = 11:00, 2pm = 14:00, 11pm = 23:00)
2. Check if that time falls within the Business Hours for the relevant day
3. If yes, confirm the business is open at that time
4. If no, explain when the business is actually open

Please provide a helpful answer based on the business information above.`;

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

module.exports = {
  generateAIResponse,
  validateOpenAIKey
};


