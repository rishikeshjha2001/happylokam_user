import { Stack } from 'expo-router';
import { theme } from '../src/constants/theme';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'happylokam',
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: '900',
            color: theme.colors.primary,
          }
        }} 
      />
      <Stack.Screen 
        name="search" 
        options={{ title: 'Search' }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ title: 'Log In' }} 
      />
      <Stack.Screen 
        name="listing/[id]" 
        options={{ title: 'Details' }} 
      />
    </Stack>
  );
}
