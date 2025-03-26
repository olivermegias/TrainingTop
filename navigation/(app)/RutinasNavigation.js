import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import RutinaScreen from '../../screens/home_screens/Rutinas/RutinaScreen';
import DetalleRutinaScreen from '../../screens/home_screens/Rutinas/DetalleRutinaScreen';

const Stack = createStackNavigator();

export default function RutinaNavigation() {
  return (
      <Stack.Navigator initialRouteName="Rutina">
        <Stack.Screen 
          name="Rutina" 
          component={RutinaScreen} 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="DetalleRutina" 
          component={DetalleRutinaScreen} 
          options={{ 
            headerShown: false,
          }}
        />
      </Stack.Navigator>
  );
}