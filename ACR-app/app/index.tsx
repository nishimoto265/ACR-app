import { Redirect } from 'expo-router';

// Redirect from the root route to the home tab
export default function RootIndex() {
  return <Redirect href="/(tabs)/home" />;
}
