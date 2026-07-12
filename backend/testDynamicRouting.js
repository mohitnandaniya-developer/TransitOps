/**
 * Test script for Dynamic Route Finding
 * Tests various Tier-2 city combinations
 * Run with: node testDynamicRouting.js
 */

const { generateRouteAndTracking } = require('./routeIntelligence');

console.log('🚀 Dynamic Route Finding - Test Suite\n');
console.log('='.repeat(70));

const testRoutes = [
  { source: 'Ahmedabad', destination: 'Mumbai', time: '09:00 AM', current: '02:30 PM' },
  { source: 'Pune', destination: 'Bangalore', time: '08:00 AM', current: '03:00 PM' },
  { source: 'Jaipur', destination: 'Delhi', time: '06:00 AM', current: '10:00 AM' },
  { source: 'Indore', destination: 'Hyderabad', time: '07:00 AM', current: '04:00 PM' },
  { source: 'Lucknow', destination: 'Kolkata', time: '09:00 AM', current: '06:00 PM' },
  { source: 'Chandigarh', destination: 'Jaipur', time: '08:00 AM', current: '02:00 PM' },
  { source: 'Nagpur', destination: 'Chennai', time: '07:00 AM', current: '05:00 PM' },
  { source: 'Rajkot', destination: 'Pune', time: '09:00 AM', current: '08:00 PM' },
  { source: 'Coimbatore', destination: 'Hyderabad', time: '06:00 AM', current: '04:00 PM' },
  { source: 'Guwahati', destination: 'Delhi', time: '08:00 AM', current: '06:00 PM' },
];

testRoutes.forEach((test, idx) => {
  console.log(`\n📍 Test ${idx + 1}: ${test.source} → ${test.destination}`);
  console.log('-'.repeat(70));
  
  try {
    const result = generateRouteAndTracking(
      test.source,
      test.destination,
      test.time,
      test.current,
      45
    );

    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
    } else {
      console.log(`✅ Route Found`);
      console.log(`   Distance: ${result.summary.total_distance_km} km`);
      console.log(`   Duration: ${result.summary.total_duration}`);
      console.log(`   Highway: ${result.summary.highway_route}`);
      console.log(`   Checkpoints: ${result.route.length}`);
      console.log(`   Status: ${result.live_status.status}`);
      console.log(`   Progress: ${result.live_status.progress_percentage}%`);
      console.log(`   Route: ${result.route.map(r => r.location).join(' → ')}`);
    }
  } catch (err) {
    console.log(`❌ ERROR: ${err.message}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('✅ All tests completed!\n');
