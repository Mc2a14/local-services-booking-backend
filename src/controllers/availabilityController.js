const availabilityService = require('../services/availabilityService');
const providerService = require('../services/providerService');

// Set availability schedule
const setAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({ error: 'availability array is required' });
    }

    // Validate each slot
    for (const slot of availability) {
      if (slot.day_of_week === undefined || slot.start_time === undefined || slot.end_time === undefined) {
        return res.status(400).json({ error: 'Each slot must have day_of_week, start_time, and end_time' });
      }
      if (slot.day_of_week < 0 || slot.day_of_week > 6) {
        return res.status(400).json({ error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' });
      }
    }

    await providerService.getProviderByUserId(req.user.id);
    const slots = await availabilityService.setAvailability(req.user.id, availability);

    res.json({
      message: 'Availability schedule updated successfully',
      availability: slots
    });
  } catch (error) {
    console.error('Set availability error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get availability schedule
const getAvailability = async (req, res) => {
  try {
    await providerService.getProviderByUserId(req.user.id);
    const availability = await availabilityService.getAvailability(req.user.id);

    res.json({ availability });
  } catch (error) {
    console.error('Get availability error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get available time slots for a date
const getAvailableTimeSlots = async (req, res) => {
  try {
    const { provider_id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required' });
    }

    const slots = await availabilityService.getAvailableTimeSlots(parseInt(provider_id), date);

    res.json({ 
      provider_id: parseInt(provider_id),
      date,
      available_slots: slots
    });
  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Block a date
const blockDate = async (req, res) => {
  try {
    const { blocked_date, reason } = req.body;

    if (!blocked_date) {
      return res.status(400).json({ error: 'blocked_date is required' });
    }

    await providerService.getProviderByUserId(req.user.id);
    const blocked = await availabilityService.blockDate(req.user.id, blocked_date, reason);

    res.json({
      message: 'Date blocked successfully',
      blocked_date: blocked
    });
  } catch (error) {
    console.error('Block date error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get blocked dates
const getBlockedDates = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date query parameters are required' });
    }

    await providerService.getProviderByUserId(req.user.id);
    const blockedDates = await availabilityService.getBlockedDates(req.user.id, start_date, end_date);

    res.json({ blocked_dates: blockedDates });
  } catch (error) {
    console.error('Get blocked dates error:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Unblock a date
const unblockDate = async (req, res) => {
  try {
    const { id } = req.params;

    await providerService.getProviderByUserId(req.user.id);
    await availabilityService.unblockDate(req.user.id, parseInt(id));

    res.json({ message: 'Date unblocked successfully' });
  } catch (error) {
    console.error('Unblock date error:', error);
    
    if (error.message === 'Blocked date not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  setAvailability,
  getAvailability,
  getAvailableTimeSlots,
  blockDate,
  getBlockedDates,
  unblockDate
};





