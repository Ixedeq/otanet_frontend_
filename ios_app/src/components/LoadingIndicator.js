import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Image, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const Logo = require("../../assets/icon.png");

// Size presets
const SIZES = {
  small: {
    logoSize: 40,
    dotCount: 6,
    dotSize: 6,
    orbitRadius: 32,
  },
  medium: {
    logoSize: 60,
    dotCount: 8,
    dotSize: 8,
    orbitRadius: 50,
  },
  large: {
    logoSize: 100,
    dotCount: 8,
    dotSize: 12,
    orbitRadius: 75,
  },
};

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

export default function LoadingIndicator({
  size = "medium",
  text = null,
  fullScreen = false,
}) {
  const rotation = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const config = SIZES[size] || SIZES.medium;
  const { logoSize, dotCount, dotSize, orbitRadius } = config;

  useEffect(() => {
    // Logo fade in
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Continuous rotation for dots
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1500,
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
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * 2 * Math.PI;
      const x = Math.cos(angle) * orbitRadius;
      const y = Math.sin(angle) * orbitRadius;

      // Staggered opacity for trailing effect
      const opacity = 0.2 + (i / dotCount) * 0.8;
      const dotSizeScaled = dotSize * (0.5 + (i / dotCount) * 0.5);

      dots.push(
        <GradientDot
          key={i}
          size={dotSizeScaled}
          opacity={opacity}
          x={x}
          y={y}
        />,
      );
    }
    return dots;
  };

  const content = (
    <View style={styles.loaderContent}>
      {/* Logo */}
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}>
        <Image
          source={Logo}
          style={[
            styles.logo,
            { width: logoSize, height: logoSize, borderRadius: logoSize * 0.2 },
          ]}
        />
      </Animated.View>

      {/* Rotating dots container */}
      <Animated.View
        style={[
          styles.dotsContainer,
          {
            width: orbitRadius * 2 + dotSize,
            height: orbitRadius * 2 + dotSize,
            transform: [{ rotate: rotationDegrees }],
          },
        ]}
      >
        {renderDots()}
      </Animated.View>

      {/* Optional text */}
      {text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreenContainer}>{content}</View>;
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loaderContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    position: "absolute",
    zIndex: 2,
  },
  logo: {
    resizeMode: "cover",
  },
  dotsContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  dotWrapper: {
    position: "absolute",
  },
  gradientDot: {
    flex: 1,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
});
