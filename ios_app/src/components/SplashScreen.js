import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Text,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
const LOGO_SIZE = 100;
const DOT_COUNT = 8;
const DOT_SIZE = 12;
const ORBIT_RADIUS = 75;

const Logo = require("../../assets/icon.png");

export default function SplashScreen() {
  const rotation = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

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

    // Text fade in after a short delay
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 600,
      delay: 300,
      useNativeDriver: true,
    }).start();

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

      // Interpolate color between #d0368a (pink) and #708ad4 (blue)
      const t = i / DOT_COUNT;
      const r = Math.round(208 + (112 - 208) * t);
      const g = Math.round(54 + (138 - 54) * t);
      const b = Math.round(138 + (212 - 138) * t);

      dots.push(
        <View
          key={i}
          style={[
            styles.dotWrapper,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: `rgb(${r}, ${g}, ${b})`,
              opacity,
              transform: [{ translateX: x }, { translateY: y }],
            },
          ]}
        />,
      );
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      {/* Animated logo – centered via absolute fill */}
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

      {/* App name below the spinner */}
      <Animated.View style={[styles.titleContainer, { opacity: textOpacity }]}>
        <Text style={styles.titleText}>
          <Text style={styles.titleOta}>Ota</Text>
          <Text style={styles.titleNet}>Net</Text>
        </Text>
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 20,
  },
  dotsContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  dotWrapper: {
    position: "absolute",
  },
  titleContainer: {
    position: "absolute",
    bottom: "30%",
  },
  titleText: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  titleOta: {
    color: "#d0368a",
  },
  titleNet: {
    color: "#f5f5f5",
    fontWeight: "400",
    opacity: 0.9,
  },
});
