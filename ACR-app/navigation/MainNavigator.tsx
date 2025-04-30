import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import HomeScreen from "../features/recordings/HomeScreen"
import RecordingDetailScreen from "../features/recordings/RecordingDetailScreen"
import SettingsScreen from "../features/settings/SettingsScreen"

export type RecordingsStackParamList = {
  Home: undefined
  RecordingDetail: { recordingId: string }
}

export type MainTabParamList = {
  RecordingsStack: undefined
  Settings: undefined
}

const RecordingsStack = createNativeStackNavigator<RecordingsStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

function RecordingsNavigator() {
  return (
    <RecordingsStack.Navigator>
      <RecordingsStack.Screen name="Home" component={HomeScreen} options={{ title: "通話録音一覧" }} />
      <RecordingsStack.Screen
        name="RecordingDetail"
        component={RecordingDetailScreen}
        options={{ title: "通話詳細" }}
      />
    </RecordingsStack.Navigator>
  )
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#2196F3",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tab.Screen
        name="RecordingsStack"
        component={RecordingsNavigator}
        options={{
          headerShown: false,
          title: "録音一覧",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="phone-log" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "設定",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}
