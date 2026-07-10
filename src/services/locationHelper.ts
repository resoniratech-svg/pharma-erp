const CITIES_DB = [
  { name: 'Karimnagar', state: 'Telangana', lat: 18.4386, lng: 79.1288 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Secunderabad', state: 'Telangana', lat: 17.4399, lng: 78.4983 },
  { name: 'Warangal', state: 'Telangana', lat: 17.9784, lng: 79.5941 },
  { name: 'Nizamabad', state: 'Telangana', lat: 18.6725, lng: 78.0941 },
  { name: 'Nalgonda', state: 'Telangana', lat: 17.0575, lng: 79.2684 },
  { name: 'Khammam', state: 'Telangana', lat: 17.2473, lng: 80.1514 },
  { name: 'Mahbubnagar', state: 'Telangana', lat: 16.7367, lng: 77.9889 },
  { name: 'Ramagundam', state: 'Telangana', lat: 18.7617, lng: 79.4750 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
  { name: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lng: 80.4365 },
  { name: 'Nellore', state: 'Andhra Pradesh', lat: 14.4426, lng: 79.9865 },
  { name: 'Kurnool', state: 'Andhra Pradesh', lat: 15.8281, lng: 78.0373 },
  { name: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Delhi', state: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
];

export const getReadableLocation = (lat: number | null, lng: number | null): string => {
  if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return 'GPS Not Available';

  let nearestCity = '';
  let nearestState = '';
  let minDistance = Infinity;

  for (const city of CITIES_DB) {
    const d = Math.sqrt(Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2));
    if (d < minDistance) {
      minDistance = d;
      nearestCity = city.name;
      nearestState = city.state;
    }
  }

  // If within ~1 degree range (approx 100km), display city name
  if (minDistance < 1.0) {
    return `${nearestCity}, ${nearestState}`;
  }
  
  return 'Location Outside Main Hubs';
};
