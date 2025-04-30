import { createNativeStackNavigator } from "@react-navigation/native-stack"

import LoginScreen from "../features/auth/LoginScreen"
import SignupScreen from "../features/auth/SignupScreen"

export type AuthStackParamList = {
  Login: undefined
  Signup: undefined
}

const Stack = createNativeStackNavigator<AuthStackParamList>()

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2196F3",
        },
        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "ログイン" }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: "アカウント作成" }} />
    </Stack.Navigator>
  )
}
