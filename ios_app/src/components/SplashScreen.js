import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const LOGO_SIZE = 100;
const DOT_COUNT = 8;
const DOT_SIZE = 12;
const ORBIT_RADIUS = 75;

const Logo = require("../../assets/icon.png");

// Gradient dot component
const GradientDot = ({ size, opacity, x, y }) => (
  <View
    style={[
      styles.dotWrapper,
      {
        width: size,
        height: size,
        opacity,
        transform: [{ translateX: x }, { translateY: y }],
      },
    ]}
  >
    <LinearGradient
      colors={["#d0368a", "#708ad4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientDot, { borderRadius: size / 2 }]}
    />
  </View>
);

export default function SplashScreen() {
  const rotation = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo fade in and scale
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation for dots
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const rotationDegrees = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Create dots positioned in a circle
  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < DOT_COUNT; i++) {
      const angle = (i / DOT_COUNT) * 2 * Math.PI;
      const x = Math.cos(angle) * ORBIT_RADIUS;
      const y = Math.sin(angle) * ORBIT_RADIUS;

      // Staggered opacity for trailing effect
      const opacity = 0.2 + (i / DOT_COUNT) * 0.8;
      const size = DOT_SIZE * (0.5 + (i / DOT_COUNT) * 0.5);

      dots.push(
        <GradientDot key={i} size={size} opacity={opacity} x={x} y={y} />,
      );
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      {/* Animated logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image source={Logo} style={styles.logo} />
      </Animated.View>

      {/* Rotating dots container */}
      <Animated.View
        style={[
          styles.dotsContainer,
          {
            transform: [{ rotate: rotationDegrees }],
          },
        ]}
      >
        {renderDots()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    position: "absolute",
    zIndex: 2,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 20,
  },
  dotsContainer: {
    position: "absolute",
    width: ORBIT_RADIUS * 2 + DOT_SIZE,
    height: ORBIT_RADIUS * 2 + DOT_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  dotWrapper: {
    position: "absolute",
  },
  gradientDot: {
    flex: 1,
  },
});
