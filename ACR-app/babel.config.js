// /media/thithilab/ボリューム1/ACR/ACR-app/babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // Use Expo's preset
  };
};
