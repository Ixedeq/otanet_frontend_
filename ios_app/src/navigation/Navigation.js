import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { UnreadProvider, useUnread } from "../context/UnreadContext";

// Screens
import HomeScreen from "../screens/HomeScreen";
import RecentScreen from "../screens/RecentScreen";
import MangaDetailScreen from "../screens/MangaDetailScreen";
import ChapterReaderScreen from "../screens/ChapterReaderScreen";
import SearchScreen from "../screens/SearchScreen";
import TagFilterScreen from "../screens/TagFilterScreen";
import BookmarksScreen from "../screens/BookmarksScreen";
import DownloadsScreen from "../screens/DownloadsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Home stack
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#1e1e1e",
        },
        headerTintColor: "#d0368a",
        headerTitleStyle: {
          color: "#f5f5f5",
          fontWeight: "700",
        },
      }}
    >
      <Stack.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: "OtaNet" }}
      />
      <Stack.Screen
        name="MangaDetail"
        component={MangaDetailScreen}
        options={({ route }) => ({
          title: route.params?.title || "Manga",
        })}
      />
      <Stack.Screen
        name="ChapterReader"
        component={ChapterReaderScreen}
        options={{
          headerShown: false,
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="TagFilter"
        component={TagFilterScreen}
        options={{ title: "Filter by Tags" }}
      />
    </Stack.Navigator>
  );
}

// Recent stack
function RecentStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#1e1e1e",
        },
        headerTintColor: "#d0368a",
        headerTitleStyle: {
          color: "#f5f5f5",
          fontWeight: "700",
        },
      }}
    >
      <Stack.Screen
        name="RecentTab"
        component={RecentScreen}
        options={{ title: "Recent" }}
      />
      <Stack.Screen
        name="MangaDetail"
        component={MangaDetailScreen}
        options={({ route }) => ({
          title: route.params?.title || "Manga",
        })}
      />
      <Stack.Screen
        name="ChapterReader"
        component={ChapterReaderScreen}
        options={{
          headerShown: false,
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="TagFilter"
        component={TagFilterScreen}
        options={{ title: "Filter by Tags" }}
      />
    </Stack.Navigator>
  );
}


// Search stack
function SearchStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#1e1e1e",
        },
        headerTintColor: "#d0368a",
        headerTitleStyle: {
          color: "#f5f5f5",
          fontWeight: "700",
        },
      }}
    >
      <Stack.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{ title: "Search" }}
      />
      <Stack.Screen
        name="TagFilter"
        component={TagFilterScreen}
        options={{ title: "Filter by Tags" }}
      />
      <Stack.Screen
        name="MangaDetail"
        component={MangaDetailScreen}
        options={({ route }) => ({
          title: route.params?.title || "Manga",
        })}
      />
      <Stack.Screen
        name="ChapterReader"
        component={ChapterReaderScreen}
        options={{
          headerShown: false,
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}

// Bookmarks stack
function BookmarksStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#1e1e1e",
        },
        headerTintColor: "#d0368a",
        headerTitleStyle: {
          color: "#f5f5f5",
          fontWeight: "700",
        },
      }}
    >
      <Stack.Screen
        name="BookmarksTab"
        component={BookmarksScreen}
        options={{ title: "Bookmarks" }}
      />
      <Stack.Screen
        name="MangaDetail"
        component={MangaDetailScreen}
        options={({ route }) => ({
          title: route.params?.title || "Manga",
        })}
      />
      <Stack.Screen
        name="ChapterReader"
        component={ChapterReaderScreen}
        options={{
          headerShown: false,
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="TagFilter"
        component={TagFilterScreen}
        options={{ title: "Filter by Tags" }}
      />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  return (
    <UnreadProvider>
      <NavigationContent />
    </UnreadProvider>
  );
}

function NavigationContent() {
  const { totalUnread, refreshUnreadCounts } = useUnread();

  useEffect(() => {
    refreshUnreadCounts();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Recent") {
              iconName = focused ? "time" : "time-outline";
            } else if (route.name === "Search") {
              iconName = focused ? "search" : "search-outline";
            } else if (route.name === "Downloads") {
              iconName = focused ? "download" : "download-outline";
            } else if (route.name === "Bookmarks") {
              iconName = focused ? "bookmark" : "bookmark-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#d0368a",
          tabBarInactiveTintColor: "#666",
          tabBarStyle: {
            backgroundColor: "#1e1e1e",
            borderTopColor: "rgba(255, 255, 255, 0.08)",
            borderTopWidth: 1,
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            title: "Home",
          }}
        />
        <Tab.Screen
          name="Recent"
          component={RecentStack}
          options={{
            title: "Recent",
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchStack}
          options={{
            title: "Search",
          }}
        />
        <Tab.Screen
          name="Downloads"
          component={DownloadsScreen}
          options={{
            title: "Downloads",
          }}
        />
        <Tab.Screen
          name="Bookmarks"
          component={BookmarksStack}
          options={{
            title: "Bookmarks",
            tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
            tabBarBadgeStyle: {
              backgroundColor: "#d0368a",
              color: "#fff",
              fontSize: 10,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
            },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
