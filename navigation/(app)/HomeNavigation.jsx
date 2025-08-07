import { createStackNavigator } from '@react-navigation/stack';

import EjecutarRutinaScreen from '../../screens/entrenamiento/EjecutarRutinaScreen';
import HomeScreen from '../../screens/home_screens/HomeScreen';

const Stack = createStackNavigator();

export default function HomeNavigation() {
  return (
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
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