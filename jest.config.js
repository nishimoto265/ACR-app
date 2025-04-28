module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|@sentry/.*|native-base|react-native-svg|firebase|@firebase/.*))',
  ],
  setupFilesAfterEnv: ['./jest.setup.ts'], // @testing-library/react-native のマッチャーを使えるようにする
};
