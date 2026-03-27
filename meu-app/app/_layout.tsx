import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { queryClientInstance } from '@/lib/query-client';

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#eab308',
    background: '#09090b',
    card: '#18181b',
    text: '#fff',
    border: '#27272a',
  },
};

function RootLayoutNav() {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="select-workout" />
      <Stack.Screen name="active-workout" />
      <Stack.Screen name="manage-workouts" />
      <Stack.Screen name="manage-exercises" />
      <Stack.Screen name="exercise-library" />
      <Stack.Screen name="manage-students" />
      <Stack.Screen name="student-workouts" />
      <Stack.Screen name="list-users" />
      <Stack.Screen name="workout-templates" />
      <Stack.Screen name="template-exercises" />
      <Stack.Screen name="setup-profile" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeProvider value={CustomDarkTheme}>
          <RootLayoutNav />
          <StatusBar style="light" />
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
