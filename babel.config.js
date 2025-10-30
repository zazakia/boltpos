module.exports = function(api) {
  api.cache(true);

  const presets = ['babel-preset-expo'];
  const plugins = [];

  // Only use reanimated plugin in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    plugins.push('react-native-reanimated/plugin');
  }

  return {
    presets,
    plugins,
  };
};
