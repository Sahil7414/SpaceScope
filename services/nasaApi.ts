
const NASA_BASE_URL = 'https://api.nasa.gov';
// The key jW02dRZUPjHyucKzCHMUZEtcJWRXToXk2DLqdFne is a known public key,
// swap this with your personal key to avoid rate limiting.
const API_KEY = 'jW02dRZUPjHyucKzCHMUZEtcJWRXToXk2DLqdFne'; 

export const fetchAPOD = async () => {
  try {
    const response = await fetch(`${NASA_BASE_URL}/planetary/apod?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('NASA API Throttled');
    return await response.json();
  } catch (error) {
    console.warn("NASA APOD Uplink Interrupted:", error);
    return null;
  }
};

export const fetchLocalWeather = async (lat: number, lon: number) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=relative_humidity_2m,apparent_temperature,cloud_cover,visibility&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Atmospheric sensor failure');
  return response.json();
};

export const fetchSpaceWeather = async () => {
  try {
    const response = await fetch(`${NASA_BASE_URL}/DONKI/notifications?api_key=${API_KEY}`);
    if (response.ok) {
      const data = await response.json();
      // Ensure we only return an array of notification objects
      if (Array.isArray(data) && data.length > 0) return data.slice(0, 15);
    }
  } catch (error) {
    console.error('NASA DONKI Uplink Failure:', error);
  }
  return []; 
};

export const fetchNearEarthObjects = async () => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const response = await fetch(`${NASA_BASE_URL}/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${API_KEY}`);
    if (response.ok) {
      const data = await response.json();
      const neos = data.near_earth_objects[today];
      if (neos && neos.length > 0) return neos;
    }
    return null;
  } catch (error) {
    console.warn('NASA NeoWs Link Lost:', error);
    return null;
  }
};
