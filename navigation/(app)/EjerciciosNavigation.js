import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import EjerciciosScreen from '../../screens/home_screens/Ejercicios/EjerciciosScreen';
import DetallesEjercicioScreen from '../../screens/home_screens/Ejercicios/DetallesEjercicioScreen';

const Stack = createStackNavigator();

export default function EjerciciosNavigation() {
  return (
      <Stack.Navigator initialRouteName="Ejercicios">
        <Stack.Screen 
          name="Ejercicios" 
          component={EjerciciosScreen} 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="DetallesEjercicio" 
          component={DetallesEjercicioScreen} 
          options={{ 
            headerShown: false,
          }}
        />
      </Stack.Navigator>
  );
}