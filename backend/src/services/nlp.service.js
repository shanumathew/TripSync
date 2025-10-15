const nlp = require('compromise');
const chrono = require('chrono-node');

/**
 * NLP Service for Ride Intent Parsing
 * Extracts location, time, and direction from natural language text
 */

/**
 * Preprocess text for NLP
 */
const preprocessText = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // normalize whitespace
    .replace(/[^\w\s:\/\-,.']/g, ''); // remove special chars except common punctuation
};

/**
 * Extract locations from text using compromise.js
 */
const extractLocations = (text) => {
  const doc = nlp(text);
  
  // Extract places (cities, landmarks, addresses)
  const places = doc.places().out('array');
  
  // Extract common location keywords
  const locationKeywords = [
    'airport', 'station', 'downtown', 'campus', 'university', 
    'mall', 'hospital', 'hotel', 'home', 'office', 'work',
    'school', 'college', 'center', 'market', 'plaza',
    'terminal', 'depot', 'stop', 'building', 'hall'
  ];
  
  const keywords = [];
  locationKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  // Combine results
  const locations = [...new Set([...places, ...keywords])];
  
  return locations;
};

/**
 * Extract origin and destination from text
 */
const extractOriginDestination = (text) => {
  const lowText = text.toLowerCase();
  
  let origin = null;
  let destination = null;
  
  // Pattern 1: "from X to Y"
  const fromToPattern = /from\s+([^to]+?)\s+to\s+(.+?)(?:\s+at|\s+on|\s+\d|$)/i;
  const fromToMatch = text.match(fromToPattern);
  
  if (fromToMatch) {
    origin = fromToMatch[1].trim();
    destination = fromToMatch[2].trim();
  }
  
  // Pattern 2: "to X from Y" (reverse order - common in natural language)
  const toFromPattern = /(?:to|going to|headed to)\s+(.+?)\s+from\s+(.+?)(?:,\s*leaving|\s+leaving|\s+at|\s+on|\s+\d|$)/i;
  const toFromMatch = text.match(toFromPattern);
  
  if (toFromMatch && !destination) {
    destination = toFromMatch[1].trim();
    origin = toFromMatch[2].trim().replace(/,\s*$/, ''); // Remove trailing comma
  }
  
  // Pattern 3: "X to Y" (simple format)
  const simpleToPattern = /^(.+?)\s+to\s+(.+?)(?:\s+at|\s+on|\s+\d|$)/i;
  const simpleToMatch = text.match(simpleToPattern);
  
  if (simpleToMatch && !destination) {
    origin = simpleToMatch[1].trim();
    destination = simpleToMatch[2].trim();
  }
  
  // Pattern 4: "going to X" or "headed to X"
  const goingToPattern = /(going|headed|heading|traveling|travelling|driving)\s+(to|towards)\s+(.+?)(?:\s+from|\s+at|\s+on|\s+\d|$)/i;
  const goingToMatch = text.match(goingToPattern);
  
  if (goingToMatch && !destination) {
    destination = goingToMatch[3].trim();
  }
  
  // Pattern 5: "coming from X"
  const comingFromPattern = /(coming|leaving|departing)\s+from\s+(.+?)(?:\s+to|\s+at|\s+on|\s+\d|$)/i;
  const comingFromMatch = text.match(comingFromPattern);
  
  if (comingFromMatch && !origin) {
    origin = comingFromMatch[2].trim();
  }
  
  // Pattern 6: "need ride to X"
  const needRidePattern = /need\s+(a\s+)?ride\s+to\s+(.+?)(?:\s+from|\s+at|\s+on|\s+\d|$)/i;
  const needRideMatch = text.match(needRidePattern);
  
  if (needRideMatch && !destination) {
    destination = needRideMatch[2].trim();
  }
  
  return { origin, destination };
};

/**
 * Detect direction (going_to or coming_from)
 * Database enum values: 'going_to', 'coming_from'
 */
const detectDirection = (text, origin, destination) => {
  const lowText = text.toLowerCase();
  
  // Check for "coming from" keywords - this takes priority
  if (lowText.includes('coming from') || 
      lowText.includes('leaving from') || 
      lowText.includes('departing from')) {
    return 'coming_from';
  }
  
  // Check for "to" keywords
  if (lowText.includes('going to') || 
      lowText.includes('headed to') || 
      lowText.includes('need ride to') ||
      lowText.includes('traveling to') ||
      lowText.includes('driving to')) {
    return 'going_to';
  }
  
  // Default: if we have a destination, assume going_to
  if (destination) {
    return 'going_to';
  }
  
  // If we only have origin, assume coming_from
  if (origin) {
    return 'coming_from';
  }
  
  return 'going_to'; // Default fallback
};

/**
 * Extract date and time using chrono-node
 */
const extractDateTime = (text) => {
  const results = chrono.parse(text);
  
  if (results.length > 0) {
    const parsed = results[0];
    const date = parsed.start.date();
    
    return {
      fullDate: date,
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      time: date.toTimeString().split(' ')[0].substring(0, 5), // HH:MM
      timestamp: date.toISOString(),
      humanReadable: date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }
  
  return null;
};

/**
 * Extract additional details
 */
const extractDetails = (text) => {
  const lowText = text.toLowerCase();
  
  // Detect urgency
  const isUrgent = lowText.includes('urgent') || 
                   lowText.includes('asap') || 
                   lowText.includes('immediately') ||
                   lowText.includes('now');
  
  // Detect flexibility
  const isFlexible = lowText.includes('flexible') || 
                     lowText.includes('anytime') || 
                     lowText.includes('whenever');
  
  // Detect passenger count
  const passengerMatch = text.match(/(\d+)\s*(people|person|passenger|seat)/i);
  const passengers = passengerMatch ? parseInt(passengerMatch[1]) : 1;
  
  // Detect luggage
  const hasLuggage = lowText.includes('luggage') || 
                     lowText.includes('bag') || 
                     lowText.includes('suitcase');
  
  return {
    isUrgent,
    isFlexible,
    passengers,
    hasLuggage
  };
};

/**
 * Main NLP Parser Function
 * Parses natural language ride intent and extracts structured data
 */
const parseRideIntent = (text) => {
  try {
    // Preprocess text
    const processedText = preprocessText(text);
    
    // Extract all components
    const locations = extractLocations(text);
    const { origin, destination } = extractOriginDestination(text);
    const direction = detectDirection(text, origin, destination);
    const dateTime = extractDateTime(text);
    const details = extractDetails(text);
    
    // Build structured result
    const result = {
      originalText: text,
      processed: true,
      data: {
        // Location data
        origin: origin || null,
        destination: destination || null,
        allLocations: locations,
        direction: direction,
        
        // Time data
        departureTime: dateTime ? dateTime.timestamp : null,
        departureDate: dateTime ? dateTime.date : null,
        departureTimeFormatted: dateTime ? dateTime.time : null,
        humanReadableTime: dateTime ? dateTime.humanReadable : null,
        
        // Additional details
        passengers: details.passengers,
        hasLuggage: details.hasLuggage,
        isUrgent: details.isUrgent,
        isFlexible: details.isFlexible,
        
        // Confidence scores (basic implementation)
        confidence: {
          location: locations.length > 0 ? 0.8 : 0.3,
          time: dateTime ? 0.9 : 0.2,
          overall: (locations.length > 0 && dateTime) ? 0.85 : 0.5
        }
      },
      success: true
    };
    
    return result;
    
  } catch (error) {
    console.error('NLP parsing error:', error);
    return {
      originalText: text,
      processed: false,
      error: error.message,
      success: false
    };
  }
};

/**
 * Validate parsed result
 */
const validateParsedData = (parsedData) => {
  const errors = [];
  
  if (!parsedData.data.destination && !parsedData.data.origin) {
    errors.push('Could not extract any location from the text');
  }
  
  if (!parsedData.data.departureTime) {
    errors.push('Could not extract date/time from the text');
  }
  
  if (parsedData.data.confidence.overall < 0.4) {
    errors.push('Low confidence in parsed data. Please provide more details.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  parseRideIntent,
  validateParsedData,
  extractLocations,
  extractDateTime,
  extractOriginDestination,
  detectDirection,
  preprocessText
};
