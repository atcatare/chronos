import React from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Alegreya_400Regular } from '@expo-google-fonts/alegreya';

import HomeScreen from './src/screens/HomeScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { COLORS } from './src/constants/colors';

const Tab = createBottomTabNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Alegreya_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 16,
            fontFamily: 'Alegreya_400Regular',
          },
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopColor: '#333333',
            height: 105,
            paddingTop: 15,
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#888888',
          tabBarShowLabel: true,
        }}
      >
        <Tab.Screen
          name="Journal"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <Image
                source={require('./assets/journal_icon.png')}
                style={{ width: 40, height: 40, opacity: focused ? 1 : 0.5 }}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Insights"
          component={InsightsScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons
                name="brain"
                size={40}
                color={focused ? '#FFFFFF' : '#888888'}
                style={{ opacity: focused ? 1 : 0.5 }}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Past Entries"
          component={HistoryScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <Image
                source={require('./assets/past_entries_icon.png')}
                style={{ width: 40, height: 40, opacity: focused ? 1 : 0.5 }}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
