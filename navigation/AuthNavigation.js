import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Bienvenido from "../screens/BienvenidoScreen.js";
import IniciarSesion from "../screens/IniciarSesionScreen.js";
import CrearUsuario from "../screens/CrearUsuarioScreen.js";


const Stack = createStackNavigator();

export default function AuthNavigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Bienvenido" component={Bienvenido} />
      <Stack.Screen name="IniciarSesion" component={IniciarSesion} />
      <Stack.Screen name="CrearUsuario" component={CrearUsuario} />
    </Stack.Navigator>
  );
}
