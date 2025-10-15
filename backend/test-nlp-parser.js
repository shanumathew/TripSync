/**
 * Test NLP Parser Service
 * Run: node backend/test-nlp-parser.js
 */

const { parseRideIntent, validateParsedData } = require('./src/services/nlp.service');

console.log('\n🧪 ========================================');
console.log('🧪 Testing NLP Ride Intent Parser');
console.log('🧪 ========================================\n');

// Test cases
const testCases = [
  "Going to airport tomorrow morning at 8 AM",
  "Need a ride from downtown to campus Friday 3pm",
  "Headed to State University today at 5:30pm",
  "Coming from airport tomorrow afternoon",
  "Anyone going to CBE station at 3 PM tomorrow",
  "Need ride downtown to campus next Monday 9am",
  "Going home for weekend, leaving Friday evening",
  "Flight at 6am tomorrow, need ride to airport",
  "Coming back from vacation Sunday night, from airport to campus",
  "Urgent! Need ride to hospital now"
];

testCases.forEach((testCase, index) => {
  console.log(`\n📝 Test ${index + 1}: "${testCase}"`);
  console.log('─'.repeat(60));
  
  const result = parseRideIntent(testCase);
  
  if (result.success) {
    console.log('✅ Parsing successful!');
    console.log('\n📍 Location Data:');
    console.log(`  Origin: ${result.data.origin || 'Not specified'}`);
    console.log(`  Destination: ${result.data.destination || 'Not specified'}`);
    console.log(`  All locations found: ${result.data.allLocations.join(', ') || 'None'}`);
    console.log(`  Direction: ${result.data.direction || 'Not detected'}`);
    
    console.log('\n⏰ Time Data:');
    if (result.data.departureTime) {
      console.log(`  Date: ${result.data.departureDate}`);
      console.log(`  Time: ${result.data.departureTimeFormatted}`);
      console.log(`  Human readable: ${result.data.humanReadableTime}`);
    } else {
      console.log('  ⚠️  No time detected');
    }
    
    console.log('\n📊 Additional Details:');
    console.log(`  Passengers: ${result.data.passengers}`);
    console.log(`  Has luggage: ${result.data.hasLuggage ? 'Yes' : 'No'}`);
    console.log(`  Urgent: ${result.data.isUrgent ? 'Yes' : 'No'}`);
    console.log(`  Flexible: ${result.data.isFlexible ? 'Yes' : 'No'}`);
    
    console.log('\n🎯 Confidence Scores:');
    console.log(`  Location: ${(result.data.confidence.location * 100).toFixed(0)}%`);
    console.log(`  Time: ${(result.data.confidence.time * 100).toFixed(0)}%`);
    console.log(`  Overall: ${(result.data.confidence.overall * 100).toFixed(0)}%`);
    
    // Validate
    const validation = validateParsedData(result);
    if (validation.isValid) {
      console.log('\n✅ Validation: PASSED');
    } else {
      console.log('\n⚠️  Validation: FAILED');
      console.log('Errors:');
      validation.errors.forEach(error => console.log(`  - ${error}`));
    }
    
  } else {
    console.log('❌ Parsing failed!');
    console.log(`Error: ${result.error}`);
  }
});

console.log('\n\n🎉 ========================================');
console.log('🎉 NLP Parser Testing Complete!');
console.log('🎉 ========================================\n');

// Summary
console.log('📊 Summary:');
console.log(`Total tests: ${testCases.length}`);
console.log('\n💡 Next steps:');
console.log('1. Backend is ready with NLP parsing');
console.log('2. Test the API endpoint: POST /api/rides');
console.log('3. Update frontend Dashboard to post rides');
console.log('4. Test with various natural language inputs\n');
