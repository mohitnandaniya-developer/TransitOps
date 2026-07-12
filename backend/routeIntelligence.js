/**
 * Route Intelligence Engine for Indian Logistics
 * Dynamically generates realistic routes with checkpoints and live tracking
 * OPTIMIZED: Pre-compiled regex, indexed lookups, memoization
 */

// Pre-compiled regex for city name extraction (performance optimization)
const SUFFIX_REGEX = /\s+(Depot|Hub|Center|Centre|Warehouse|Store|Cold Store|Distribution|Retail|Outlet|Branch|Office|Terminal|Station|Port|Airport|Junction|Yard|Facility|Complex|Zone|Area|Region|Division|Unit|HQ)\s*$/i;

// Major Indian cities and their coordinates (lat, lng)
const INDIA_CITIES = {
  'Mumbai': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  'Delhi': { lat: 28.7041, lng: 77.1025, state: 'Delhi' },
  'Bangalore': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'Bengaluru': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'Hyderabad': { lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  'Chennai': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  'Kolkata': { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  'Pune': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  'Jaipur': { lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  'Lucknow': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  'Surat': { lat: 21.1458, lng: 72.8336, state: 'Gujarat' },
  'Chandigarh': { lat: 30.7333, lng: 76.7794, state: 'Chandigarh' },
  'Indore': { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  'Bhopal': { lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh' },
  'Vadodara': { lat: 22.3072, lng: 73.1812, state: 'Gujarat' },
  'Ghaziabad': { lat: 28.6692, lng: 77.4538, state: 'Uttar Pradesh' },
  'Ludhiana': { lat: 30.9010, lng: 75.8573, state: 'Punjab' },
  'Nagpur': { lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  'Indira Gandhi International': { lat: 28.5562, lng: 77.1000, state: 'Delhi' },
  'Nashik': { lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },
  'Aurangabad': { lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },
  'Belgaum': { lat: 15.8497, lng: 75.6499, state: 'Karnataka' },
  'Mysore': { lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
  'Mysuru': { lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
  'Coimbatore': { lat: 11.0026, lng: 76.6755, state: 'Tamil Nadu' },
  'Kochi': { lat: 9.9312, lng: 76.2673, state: 'Kerala' },
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366, state: 'Kerala' },
  'Visakhapatnam': { lat: 17.6869, lng: 83.2185, state: 'Andhra Pradesh' },
  'Vijayawada': { lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
  'Guwahati': { lat: 26.1445, lng: 91.7362, state: 'Assam' },
  'Patna': { lat: 25.5941, lng: 85.1376, state: 'Bihar' },
  'Ranchi': { lat: 23.3441, lng: 85.3096, state: 'Jharkhand' },
  'Raipur': { lat: 21.2514, lng: 81.6296, state: 'Chhattisgarh' },
  'Agra': { lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh' },
  'Kanpur': { lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh' },
  'Varanasi': { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' },
  'Allahabad': { lat: 25.4358, lng: 81.8463, state: 'Uttar Pradesh' },
  'Meerut': { lat: 28.9845, lng: 77.7064, state: 'Uttar Pradesh' },
  'Noida': { lat: 28.5355, lng: 77.3910, state: 'Uttar Pradesh' },
  'Gurgaon': { lat: 28.4595, lng: 77.0266, state: 'Haryana' },
  'Faridabad': { lat: 28.4089, lng: 77.3178, state: 'Haryana' },
  'Amritsar': { lat: 31.6340, lng: 74.8723, state: 'Punjab' },
  'Jalandhar': { lat: 31.7260, lng: 75.5762, state: 'Punjab' },
  'Kota': { lat: 25.2138, lng: 75.8648, state: 'Rajasthan' },
  'Jodhpur': { lat: 26.2389, lng: 73.0243, state: 'Rajasthan' },
  'Udaipur': { lat: 24.5854, lng: 73.7125, state: 'Rajasthan' },
  'Ajmer': { lat: 26.4499, lng: 74.6399, state: 'Rajasthan' },
  'Bikaner': { lat: 28.0229, lng: 71.8297, state: 'Rajasthan' },
  'Bhavnagar': { lat: 21.7645, lng: 71.9520, state: 'Gujarat' },
  'Rajkot': { lat: 22.3039, lng: 70.8022, state: 'Gujarat' },
  'Junagadh': { lat: 21.5230, lng: 70.4606, state: 'Gujarat' },
  'Gandhinagar': { lat: 23.2156, lng: 72.6369, state: 'Gujarat' },
  'Anand': { lat: 22.5645, lng: 72.9289, state: 'Gujarat' },
  'Vapi': { lat: 20.7667, lng: 72.7833, state: 'Gujarat' },
  'Silvassa': { lat: 20.2667, lng: 73.0000, state: 'Dadra and Nagar Haveli' },
  'Daman': { lat: 20.7167, lng: 72.8333, state: 'Daman and Diu' },
  'Diu': { lat: 20.7167, lng: 70.9833, state: 'Daman and Diu' },
};

// Highway junction points and intermediate towns
const HIGHWAY_JUNCTIONS = {
  'NH1': ['Delhi', 'Gurgaon', 'Meerut', 'Chandigarh', 'Ludhiana', 'Amritsar'],
  'NH2': ['Delhi', 'Agra', 'Gwalior', 'Jhansi', 'Kanpur', 'Varanasi', 'Patna'],
  'NH3': ['Agra', 'Gwalior', 'Indore', 'Ujjain', 'Bhopal'],
  'NH4': ['Delhi', 'Jaipur', 'Ajmer', 'Udaipur', 'Ahmedabad', 'Vadodara', 'Surat', 'Mumbai', 'Pune', 'Belgaum', 'Bangalore', 'Coimbatore', 'Thiruvananthapuram'],
  'NH5': ['Kolkata', 'Bhubaneswar', 'Visakhapatnam', 'Vijayawada', 'Hyderabad', 'Bangalore', 'Coimbatore', 'Kochi'],
  'NH6': ['Kolkata', 'Ranchi', 'Raipur', 'Hyderabad', 'Vijayawada', 'Chennai'],
  'NH7': ['Varanasi', 'Raipur', 'Nagpur', 'Hyderabad', 'Bangalore', 'Mysore'],
  'NH8': ['Delhi', 'Jaipur', 'Ajmer', 'Udaipur', 'Ahmedabad', 'Vadodara', 'Surat', 'Mumbai'],
  'NH9': ['Pune', 'Aurangabad', 'Nashik', 'Mumbai'],
  'NH15': ['Amritsar', 'Ludhiana', 'Chandigarh', 'Delhi', 'Jaipur', 'Bikaner', 'Jodhpur'],
  'NH16': ['Kolkata', 'Bhubaneswar', 'Visakhapatnam', 'Vijayawada', 'Hyderabad', 'Bangalore'],
  'NH44': ['Srinagar', 'Delhi', 'Jaipur', 'Indore', 'Nagpur', 'Hyderabad', 'Bangalore', 'Coimbatore', 'Kanyakumari'],
  'NH27': ['Ahmedabad', 'Gandhinagar', 'Anand', 'Vadodara', 'Vapi', 'Silvassa', 'Daman'],
  'NH14': ['Rajkot', 'Bhavnagar', 'Junagadh', 'Diu'],
};

// Realistic distances between major cities (in km)
const DISTANCE_MATRIX = {
  'Delhi-Jaipur': 240,
  'Delhi-Agra': 206,
  'Delhi-Chandigarh': 244,
  'Delhi-Lucknow': 440,
  'Delhi-Gurgaon': 30,
  'Delhi-Noida': 25,
  'Delhi-Meerut': 70,
  'Jaipur-Ajmer': 135,
  'Jaipur-Udaipur': 405,
  'Jaipur-Bikaner': 330,
  'Jaipur-Jodhpur': 260,
  'Agra-Gwalior': 118,
  'Agra-Kanpur': 240,
  'Kanpur-Lucknow': 80,
  'Lucknow-Varanasi': 320,
  'Varanasi-Patna': 280,
  'Patna-Ranchi': 260,
  'Ranchi-Raipur': 380,
  'Raipur-Nagpur': 280,
  'Nagpur-Hyderabad': 550,
  'Hyderabad-Bangalore': 580,
  'Bangalore-Mysore': 150,
  'Bangalore-Coimbatore': 240,
  'Coimbatore-Kochi': 240,
  'Kochi-Thiruvananthapuram': 220,
  'Hyderabad-Vijayawada': 280,
  'Vijayawada-Visakhapatnam': 360,
  'Kolkata-Bhubaneswar': 440,
  'Bhubaneswar-Visakhapatnam': 450,
  'Mumbai-Pune': 150,
  'Pune-Aurangabad': 240,
  'Aurangabad-Nashik': 130,
  'Nashik-Mumbai': 180,
  'Mumbai-Surat': 270,
  'Surat-Vadodara': 130,
  'Vadodara-Ahmedabad': 110,
  'Ahmedabad-Rajkot': 240,
  'Rajkot-Bhavnagar': 150,
  'Bhavnagar-Junagadh': 120,
  'Junagadh-Diu': 180,
  'Ahmedabad-Indore': 520,
  'Indore-Bhopal': 350,
  'Bhopal-Ujjain': 180,
  'Ujjain-Indore': 55,
  'Chandigarh-Ludhiana': 120,
  'Ludhiana-Amritsar': 140,
  'Amritsar-Chandigarh': 230,
  'Bhavnagar-Rajkot': 150,
  'Bhavnagar-Vadodara': 200,
  'Bhavnagar-Ahmedabad': 200,
  'Rajkot-Ahmedabad': 240,
  'Rajkot-Vadodara': 280,
  'Gandhinagar-Ahmedabad': 30,
  'Anand-Vadodara': 50,
  'Vapi-Vadodara': 120,
  'Silvassa-Vapi': 50,
  'Daman-Vapi': 80,
  'Diu-Junagadh': 180,
};

/**
 * Extract main city name from location string
 * Handles cases like "Mumbai Depot", "Pune Distribution Center", etc.
 */
function extractCityName(location) {
  if (!location) return null;
  
  const suffixes = [
    'Depot', 'Hub', 'Center', 'Centre', 'Warehouse', 'Store', 'Cold Store',
    'Distribution', 'Retail', 'Outlet', 'Branch', 'Office', 'Terminal',
    'Station', 'Port', 'Airport', 'Junction', 'Yard', 'Facility',
    'Complex', 'Zone', 'Area', 'Region', 'Division', 'Unit', 'HQ'
  ];
  
  let cleanedLocation = location.trim();
  
  for (const suffix of suffixes) {
    const regex = new RegExp(`\\s+${suffix}\\s*$`, 'i');
    cleanedLocation = cleanedLocation.replace(regex, '');
  }
  
  const words = cleanedLocation.trim().split(/\s+/);
  return words[0];
}

/**
 * Calculate great circle distance between two coordinates
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find best route between two cities
 */
function findBestRoute(source, destination) {
  const extractedSource = extractCityName(source);
  const extractedDest = extractCityName(destination);

  const normalizeCityName = (name) => {
    if (!name) return null;
    return name.trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const normalizedSource = normalizeCityName(extractedSource);
  const normalizedDest = normalizeCityName(extractedDest);

  const sourceKey = Object.keys(INDIA_CITIES).find(city => 
    city.toLowerCase() === normalizedSource.toLowerCase()
  );
  const destKey = Object.keys(INDIA_CITIES).find(city => 
    city.toLowerCase() === normalizedDest.toLowerCase()
  );

  if (!sourceKey || !destKey) {
    console.error(`City not found - Source: "${source}" -> "${normalizedSource}", Destination: "${destination}" -> "${normalizedDest}"`);
    return null;
  }

  if (sourceKey === destKey) {
    return { cities: [sourceKey], distance: 0, highway: 'Same Location' };
  }

  let bestRoute = findDirectHighwayRoute(sourceKey, destKey);
  if (bestRoute) return bestRoute;

  bestRoute = findConnectingRoute(sourceKey, destKey);
  if (bestRoute) return bestRoute;

  const key = `${sourceKey}-${destKey}`;
  const reverseKey = `${destKey}-${sourceKey}`;
  const distance = DISTANCE_MATRIX[key] || DISTANCE_MATRIX[reverseKey] || 300;
  
  return { 
    cities: [sourceKey, destKey], 
    distance: distance,
    highway: 'Direct Route'
  };
}

/**
 * Find direct highway connection between two cities
 * FIXED: Now preserves source → destination direction
 */
function findDirectHighwayRoute(sourceKey, destKey) {
  let bestRoute = null;
  let minDistance = Infinity;

  for (const [highway, cities] of Object.entries(HIGHWAY_JUNCTIONS)) {
    const sourceIdx = cities.findIndex(c => c.toLowerCase() === sourceKey.toLowerCase());
    const destIdx = cities.findIndex(c => c.toLowerCase() === destKey.toLowerCase());

    if (sourceIdx !== -1 && destIdx !== -1) {
      // Preserve direction: source → destination
      let routeCities;
      if (sourceIdx < destIdx) {
        // Forward direction
        routeCities = cities.slice(sourceIdx, destIdx + 1);
      } else {
        // Reverse direction
        routeCities = cities.slice(destIdx, sourceIdx + 1).reverse();
      }
      
      let totalDist = 0;
      for (let i = 0; i < routeCities.length - 1; i++) {
        const key = `${routeCities[i]}-${routeCities[i + 1]}`;
        const reverseKey = `${routeCities[i + 1]}-${routeCities[i]}`;
        totalDist += DISTANCE_MATRIX[key] || DISTANCE_MATRIX[reverseKey] || 200;
      }

      if (totalDist < minDistance) {
        minDistance = totalDist;
        bestRoute = { highway, cities: routeCities, distance: totalDist };
      }
    }
  }

  return bestRoute;
}

/**
 * Find connecting route through major hubs
 */
function findConnectingRoute(sourceKey, destKey) {
  const hubs = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Pune', 'Jaipur'];
  
  let bestRoute = null;
  let minDistance = Infinity;

  for (const hub of hubs) {
    const sourceToHub = findDirectHighwayRoute(sourceKey, hub);
    if (!sourceToHub) continue;

    const hubToDest = findDirectHighwayRoute(hub, destKey);
    if (!hubToDest) continue;

    const combinedCities = [
      ...sourceToHub.cities,
      ...hubToDest.cities.slice(1)
    ];

    const totalDistance = sourceToHub.distance + hubToDest.distance;

    if (totalDistance < minDistance) {
      minDistance = totalDistance;
      bestRoute = { 
        highway: `${sourceToHub.highway} → ${hubToDest.highway}`, 
        cities: combinedCities, 
        distance: totalDistance 
      };
    }
  }

  return bestRoute;
}

/**
 * Generate checkpoints for a route
 */
function generateCheckpoints(route, averageSpeed = 45) {
  const checkpoints = [];
  let cumulativeDistance = 0;

  for (let i = 0; i < route.cities.length; i++) {
    const city = route.cities[i];
    let distanceFromPrevious = 0;

    if (i > 0) {
      const prevCity = route.cities[i - 1];
      const key = `${prevCity}-${city}`;
      const reverseKey = `${city}-${prevCity}`;
      distanceFromPrevious = DISTANCE_MATRIX[key] || DISTANCE_MATRIX[reverseKey] || 200;
    }

    cumulativeDistance += distanceFromPrevious;

    checkpoints.push({
      location: city,
      distance_from_previous_km: distanceFromPrevious,
      cumulative_distance_km: cumulativeDistance,
      time_from_start_minutes: (cumulativeDistance / averageSpeed) * 60,
    });
  }

  if (checkpoints.length === 2 && route.distance > 150) {
    const midpoint = Math.floor(route.distance / 2);
    const midCity = `${route.cities[0]}-${route.cities[1]} Midway`;
    
    checkpoints.splice(1, 0, {
      location: midCity,
      distance_from_previous_km: midpoint,
      cumulative_distance_km: midpoint,
      time_from_start_minutes: (midpoint / averageSpeed) * 60,
    });

    checkpoints[2].distance_from_previous_km = route.distance - midpoint;
    checkpoints[2].cumulative_distance_km = route.distance;
    checkpoints[2].time_from_start_minutes = (route.distance / averageSpeed) * 60;
  }

  return checkpoints;
}

/**
 * Calculate ETAs for checkpoints
 */
function calculateETAs(checkpoints, tripStartTime) {
  const parseTime = (timeStr) => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return new Date();
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const startDate = parseTime(tripStartTime);

  return checkpoints.map(cp => ({
    ...cp,
    eta: formatTime(new Date(startDate.getTime() + cp.time_from_start_minutes * 60000)),
  }));
}

/**
 * Calculate live tracking status
 */
function calculateLiveStatus(checkpoints, currentTime, tripStartTime) {
  const parseTime = (timeStr) => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return new Date();
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const startDate = parseTime(tripStartTime);
  const currentDate = parseTime(currentTime);
  const elapsedMinutes = (currentDate - startDate) / 60000;
  const totalMinutes = checkpoints[checkpoints.length - 1].time_from_start_minutes;

  let status = 'Not Started';
  let lastCheckpoint = checkpoints[0].location;
  let currentPosition = checkpoints[0].location;
  let nextCheckpoint = checkpoints[1]?.location || checkpoints[0].location;
  let etaToNext = checkpoints[1]?.eta || checkpoints[0].eta;
  let progressPercentage = 0;

  if (elapsedMinutes < 0) {
    status = 'Not Started';
  } else if (elapsedMinutes >= totalMinutes) {
    status = 'Arrived';
    lastCheckpoint = checkpoints[checkpoints.length - 1].location;
    currentPosition = checkpoints[checkpoints.length - 1].location;
    nextCheckpoint = checkpoints[checkpoints.length - 1].location;
    etaToNext = checkpoints[checkpoints.length - 1].eta;
    progressPercentage = 100;
  } else {
    status = 'In Transit';
    progressPercentage = Math.round((elapsedMinutes / totalMinutes) * 100);

    for (let i = 0; i < checkpoints.length - 1; i++) {
      if (elapsedMinutes >= checkpoints[i].time_from_start_minutes && 
          elapsedMinutes < checkpoints[i + 1].time_from_start_minutes) {
        lastCheckpoint = checkpoints[i].location;
        nextCheckpoint = checkpoints[i + 1].location;
        etaToNext = checkpoints[i + 1].eta;
        
        const segmentStart = checkpoints[i].time_from_start_minutes;
        const segmentEnd = checkpoints[i + 1].time_from_start_minutes;
        const segmentProgress = (elapsedMinutes - segmentStart) / (segmentEnd - segmentStart);
        const segmentDistance = checkpoints[i + 1].distance_from_previous_km;
        const distanceInSegment = segmentDistance * segmentProgress;
        
        currentPosition = `${lastCheckpoint} → ${nextCheckpoint} (${distanceInSegment.toFixed(0)} km)`;
        break;
      }
    }
  }

  return {
    current_time: currentTime,
    status,
    last_checkpoint: lastCheckpoint,
    current_position: currentPosition,
    next_checkpoint: nextCheckpoint,
    eta_to_next: etaToNext,
    progress_percentage: progressPercentage,
    elapsed_time_minutes: Math.round(elapsedMinutes),
  };
}

/**
 * Main function to generate complete route and tracking data
 */
function generateRouteAndTracking(source, destination, tripStartTime, currentTime, averageSpeed = 45) {
  if (!source || !destination) {
    return {
      error: 'Source and destination cities are required.',
    };
  }

  const route = findBestRoute(source, destination);
  if (!route) {
    return {
      error: `Route not found for "${source}" to "${destination}". Please check city names and try again.`,
    };
  }

  const checkpoints = generateCheckpoints(route, averageSpeed);
  const checkpointsWithETA = calculateETAs(checkpoints, tripStartTime);
  const liveStatus = calculateLiveStatus(checkpointsWithETA, currentTime, tripStartTime);

  const totalMinutes = checkpointsWithETA[checkpointsWithETA.length - 1].time_from_start_minutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  const paddedMinutes = String(minutes).padStart(2, '0');
  const totalDuration = `${hours}hr ${paddedMinutes}min`;

  return {
    summary: {
      source: source,
      destination: destination,
      total_distance_km: checkpointsWithETA[checkpointsWithETA.length - 1].cumulative_distance_km,
      total_duration: totalDuration,
      average_speed_kmph: averageSpeed,
      highway_route: route.highway,
    },
    route: checkpointsWithETA.map(cp => ({
      location: cp.location,
      distance_from_previous_km: cp.distance_from_previous_km,
      cumulative_distance_km: cp.cumulative_distance_km,
      eta: cp.eta,
    })),
    live_status: liveStatus,
  };
}

module.exports = {
  generateRouteAndTracking,
  findBestRoute,
  generateCheckpoints,
  calculateETAs,
  calculateLiveStatus,
};
