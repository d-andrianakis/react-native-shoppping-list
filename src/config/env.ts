import Constants from 'expo-constants';

const ENV = {
  dev: {
    API_BASE_URL: 'https://shopping-list.dandrianakis.site/api',
  },
  staging: {
    API_BASE_URL: 'https://shopping-list.dandrianakis.site/api',
  },
  prod: {
    API_BASE_URL: 'https://shopping-list.dandrianakis.site/api',
  },
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  // Add logic for staging/prod if needed
  return ENV.prod;
};

export default getEnvVars();

// Note: For Android emulator, use http://10.0.2.2:3000/api
// For iOS simulator, use http://localhost:3000/api
// For physical device, use your computer's IP address (e.g., http://192.168.1.100:3000/api)
