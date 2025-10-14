import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000000" />
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'index') {
              iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
            } else if (route.name === 'habits') {
              iconName = focused ? 'fitness' : 'fitness-outline';
            } else if (route.name === 'leaderboard') {
              iconName = focused ? 'trophy' : 'trophy-outline';
            } else if (route.name === 'alarm') {
              iconName = focused ? 'alarm' : 'alarm-outline';
            } else if (route.name === 'profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#00BFFF',
          tabBarInactiveTintColor: '#666666',
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopColor: '#1a1a1a',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerStyle: {
            backgroundColor: '#000000',
            borderBottomColor: '#1a1a1a',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Winter Coach',
            tabBarLabel: 'Coach'
          }} 
        />
        <Tabs.Screen 
          name="habits" 
          options={{ 
            title: 'Discipline Track',
            tabBarLabel: 'Habits'
          }} 
        />
        <Tabs.Screen 
          name="leaderboard" 
          options={{ 
            title: 'Frozen Warriors',
            tabBarLabel: 'Leaderboard'
          }} 
        />
        <Tabs.Screen 
          name="alarm" 
          options={{ 
            title: 'Roast Alarm',
            tabBarLabel: 'Alarm'
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ 
            title: 'Winter Profile',
            tabBarLabel: 'Profile'
          }} 
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
