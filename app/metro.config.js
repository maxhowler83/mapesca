// Lets the app import the shared model from ../packages (one source of truth
// for the app, the website and the data pipeline).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '../packages')];
module.exports = config;
