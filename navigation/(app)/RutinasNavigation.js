import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import RutinaScreen from '../../screens/home_screens/Rutinas/RutinaScreen';
import DetalleRutinaScreen from '../../screens/home_screens/Rutinas/DetalleRutinaScreen';
import CrearRutinasScreen from '../../screens/home_screens/Rutinas/CrearRutinasScreen';
import EditarRutinaScreen from '../../screens/home_screens/Rutinas/EditarRutinaScreen';
import EjecutarRutinaScreen from '../../screens/entrenamiento/EjecutarRutinaScreen';

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
        <Stack.Screen 
          name="CrearRutina" 
          component={CrearRutinasScreen} 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="EditarRutina" 
          component={EditarRutinaScreen} 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="EjecutarRutina" 
          component={EjecutarRutinaScreen} 
          options={{ 
            headerShown: false,
          }}
        />
      </Stack.Navigator>
  );
}