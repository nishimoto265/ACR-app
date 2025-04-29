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
  moduleNameMapper: {
    // Handle module aliases (this will be similar to the paths configured in tsconfig.json)
    '^services/(.*)$': '<rootDir>/services/$1',
    '^components/(.*)$': '<rootDir>/components/$1',
    '^features/(.*)$': '<rootDir>/features/$1',
    '^hooks/(.*)$': '<rootDir>/hooks/$1',
    '^navigation/(.*)$': '<rootDir>/navigation/$1',
    '^utils/(.*)$': '<rootDir>/utils/$1',
    // Add other aliases here if needed
  },
  fakeTimers: {
    enableGlobally: true,
  },
};
