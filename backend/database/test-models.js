// Test Models - Run this to verify all models work correctly
// Command: node database/test-models.js

require('dotenv').config();
const { User, Ride, Match, Message } = require('../src/models');

const testModels = async () => {
  console.log('\n🧪 Testing TripSync Models...\n');

  try {
    // ============================================
    // CLEANUP: Remove any existing test data first
    // ============================================
    console.log('🧹 Cleaning up any existing test data...');
    const db = require('../src/config/database');
    await db.query(`DELETE FROM users WHERE email LIKE 'test%@university.edu'`);
    console.log('✅ Cleanup complete\n');

    // ============================================
    // TEST 1: User Model
    // ============================================
    console.log('📝 Test 1: User Model');
    console.log('─────────────────────────────────────');

    // Create test user
    console.log('Creating test user...');
    const newUser = await User.create({
      email: 'test@university.edu',
      password: 'password123',
      name: 'Test User',
      university: 'State University',
      phone: '1234567890',
    });
    console.log('✅ User created:', newUser.name, `(ID: ${newUser.id})`);

    // Find user by ID
    const foundUser = await User.findById(newUser.id);
    console.log('✅ User found by ID:', foundUser.name);

    // Find user by email
    const foundByEmail = await User.findByEmail('test@university.edu');
    console.log('✅ User found by email:', foundByEmail.name);

    // Update user
    const updatedUser = await User.update(newUser.id, { phone: '9876543210' });
    console.log('✅ User updated:', updatedUser.phone);

    // Get user stats
    const userStats = await User.getStats(newUser.id);
    console.log('✅ User stats:', userStats);

    console.log('');

    // ============================================
    // TEST 2: Ride Model
    // ============================================
    console.log('📝 Test 2: Ride Model');
    console.log('─────────────────────────────────────');

    // Create test ride
    console.log('Creating test ride...');
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2);

    const newRide = await Ride.create({
      user_id: newUser.id,
      raw_message: 'Going to CBE station at 3 PM tomorrow',
      destination: 'CBE Station',
      origin: 'University Campus',
      destination_lat: 11.0168,
      destination_lng: 76.9558,
      ride_time: futureTime,
      flexibility_minutes: 30,
      seats_available: 2,
    });
    console.log('✅ Ride created:', newRide.destination, `(ID: ${newRide.id})`);

    // Find ride by ID
    const foundRide = await Ride.findById(newRide.id);
    console.log('✅ Ride found by ID:', foundRide.destination);

    // Find active rides
    const activeRides = await Ride.findActive(1, 10);
    console.log('✅ Active rides found:', activeRides.length);

    // Find rides by user
    const userRides = await Ride.findByUserId(newUser.id);
    console.log('✅ User rides found:', userRides.length);

    // Update ride status
    const updatedRide = await Ride.updateStatus(newRide.id, newUser.id, 'active');
    console.log('✅ Ride status updated:', updatedRide.status);

    console.log('');

    // ============================================
    // TEST 3: Create Second User and Ride for Matching
    // ============================================
    console.log('📝 Test 3: Creating second user for matching');
    console.log('─────────────────────────────────────');

    const user2 = await User.create({
      email: 'test2@university.edu',
      password: 'password123',
      name: 'Test User 2',
      university: 'State University',
      phone: '5555555555',
    });
    console.log('✅ Second user created:', user2.name, `(ID: ${user2.id})`);

    const ride2 = await Ride.create({
      user_id: user2.id,
      raw_message: 'Heading to CBE station around 3 PM',
      destination: 'CBE Station',
      destination_lat: 11.0168,
      destination_lng: 76.9558,
      ride_time: futureTime,
      flexibility_minutes: 45,
      seats_available: 1,
    });
    console.log('✅ Second ride created:', ride2.destination, `(ID: ${ride2.id})`);

    console.log('');

    // ============================================
    // TEST 4: Match Model
    // ============================================
    console.log('📝 Test 4: Match Model');
    console.log('─────────────────────────────────────');

    // Create match
    console.log('Creating match...');
    const newMatch = await Match.create({
      ride1_id: newRide.id,
      ride2_id: ride2.id,
      match_score: 85.5,
      time_score: 90.0,
      location_score: 95.0,
      trust_score: 75.0,
      initiated_by: newUser.id,
    });
    console.log('✅ Match created:', `Score: ${newMatch.match_score}`, `(ID: ${newMatch.id})`);

    // Find match by ID
    const foundMatch = await Match.findById(newMatch.id);
    console.log('✅ Match found:', foundMatch.ride1_destination, '↔', foundMatch.ride2_destination);

    // Find matches for ride
    const rideMatches = await Match.findByRideId(newRide.id);
    console.log('✅ Matches for ride:', rideMatches.length);

    // Update match status
    const acceptedMatch = await Match.updateStatus(newMatch.id, 'accepted', user2.id);
    console.log('✅ Match status updated:', acceptedMatch.status);

    console.log('');

    // ============================================
    // TEST 5: Message Model
    // ============================================
    console.log('📝 Test 5: Message Model');
    console.log('─────────────────────────────────────');

    // Send message
    console.log('Sending message...');
    const newMessage = await Message.create({
      sender_id: newUser.id,
      receiver_id: user2.id,
      match_id: newMatch.id,
      message: 'Hey! Let\'s share the ride to CBE station!',
    });
    console.log('✅ Message sent:', newMessage.message.substring(0, 30) + '...');

    // Get conversation
    const conversation = await Message.getConversation(newUser.id, user2.id);
    console.log('✅ Conversation messages:', conversation.length);

    // Send reply
    const reply = await Message.create({
      sender_id: user2.id,
      receiver_id: newUser.id,
      match_id: newMatch.id,
      message: 'Sounds great! See you at 3 PM.',
    });
    console.log('✅ Reply sent:', reply.message);

    // Get unread count
    const unreadCount = await Message.getUnreadCount(newUser.id);
    console.log('✅ Unread messages:', unreadCount);

    // Mark as read
    await Message.markAsRead(reply.id, newUser.id);
    console.log('✅ Message marked as read');

    console.log('');

    // ============================================
    // CLEANUP: Delete test data
    // ============================================
    console.log('🧹 Cleaning up test data...');
    console.log('─────────────────────────────────────');

    await Message.deleteConversation(newUser.id, user2.id);
    console.log('✅ Messages deleted');

    await Match.delete(newMatch.id, newUser.id);
    console.log('✅ Match deleted');

    await Ride.delete(newRide.id, newUser.id);
    await Ride.delete(ride2.id, user2.id);
    console.log('✅ Rides deleted');

    await User.hardDelete(newUser.id);
    await User.hardDelete(user2.id);
    console.log('✅ Users deleted');

    console.log('');

    // ============================================
    // SUMMARY
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ User Model: Working');
    console.log('✅ Ride Model: Working');
    console.log('✅ Match Model: Working');
    console.log('✅ Message Model: Working');
    console.log('');
    console.log('🚀 All models are ready for use!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Failed:\n');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    console.error('\n');
    process.exit(1);
  }
};

// Run tests
testModels();
