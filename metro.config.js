const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Axios v1.13+ sets "main" to the Node build (which imports "crypto").
// Override resolution to use the browser build for React Native.
const axiosBrowserPath = path.resolve(
  __dirname,
  'node_modules/axios/dist/browser/axios.cjs'
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'axios') {
    return { filePath: axiosBrowserPath, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
