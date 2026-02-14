const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configure the resolver to use React Native/browser builds instead of Node builds
config.resolver.resolverMainFields = ['react-native', 'browser', 'module', 'main'];

// Resolve to use export conditions
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require'];

module.exports = config;
