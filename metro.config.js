const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 'wasm' to the list of asset extensions so Metro can bundle it properly
config.resolver.assetExts.push('wasm');
// And/or sourceExts, if needed. For wasm, assetExts is usually correct, but sometimes we need it in sourceExts
config.resolver.sourceExts.push('wasm');

module.exports = config;
