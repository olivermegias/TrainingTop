import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

//screens
import Perfil from "../screens/home_screens/PerfilScreen";
import EjerciciosNavigation from "./(app)/EjerciciosNavigation";
import RutinaNavigation from "./(app)/RutinasNavigation";
import Progreso from "../screens/home_screens/ProgresoScreen";
import HomeNavigation from "./(app)/HomeNavigation";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

const Tab = createBottomTabNavigator();
const getTabBarVisibility = (route) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  if (routeName === "EjecutarRutina") {
    return { display: "none" };
  }
  return {
    height: 70,
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  };
};

export default function AppNavigation() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, focused, size }) => {
          let iconName;

          if (route.name === "Home")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "Perfil")
            iconName = focused ? "person" : "person-outline";
          else if (route.name === "Ejercicios")
            iconName = focused ? "barbell" : "barbell-outline";
          else if (route.name === "Rutinas")
            iconName = focused ? "list" : "list-outline";
          else if (route.name === "Progreso")
            iconName = focused ? "stats-chart" : "stats-chart-outline";

          // Si está enfocado, muestra el icono en un círculo
          if (focused) {
            return (
              <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={24} color="#FFFFFF" />
              </View>
            );
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: "#6200EE", // Color morado principal (el mismo que usamos en las otras pantallas)
        tabBarInactiveTintColor: "#9E9E9E",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: Platform.OS === "ios" ? 0 : 5,
        },
        tabBarStyle: {
          height: 70,
          paddingHorizontal: 10,
          paddingTop: 5,
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F0F0F0",
          elevation: 8,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
      })}
    >
      <Tab.Screen
        name="Progreso"
        component={Progreso}
        options={{ tabBarLabel: "Progreso" }}
      />
      <Tab.Screen
        name="Ejercicios"
        component={EjerciciosNavigation}
        options={{ tabBarLabel: "Ejercicios" }}
      />
      <Tab.Screen
        name="Home"
        component={HomeNavigation}
        options={({ route }) => ({
          tabBarLabel: "Inicio",
          tabBarStyle: getTabBarVisibility(route),
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.homeIconContainer,
                focused ? styles.homeIconFocused : {},
              ]}
            >
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={28}
                color={focused ? "#FFFFFF" : "#6200EE"}
              />
            </View>
          ),
        })}
      />
      <Tab.Screen
        name="Rutinas"
        component={RutinaNavigation}
        options={({ route }) => ({
          tabBarLabel: "Rutinas",
          tabBarStyle: getTabBarVisibility(route),
        })}
      />
      <Tab.Screen
        name="Perfil"
        component={Perfil}
        options={{ tabBarLabel: "Perfil" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    backgroundColor: "#6200EE",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 3,
  },
  homeIconContainer: {
    backgroundColor: "#F0F0F0",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  homeIconFocused: {
    backgroundColor: "#6200EE",
    borderColor: "#F0F0F0",
  },
});
