import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Image, Text } from "react-native";

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

      const opacity = 0.2 + (i / dotCount) * 0.8;
      const dotSizeScaled = dotSize * (0.5 + (i / dotCount) * 0.5);

      // Interpolate color from pink to blue
      const t = i / dotCount;
      const r = Math.round(208 + (112 - 208) * t);
      const g = Math.round(54 + (138 - 54) * t);
      const b = Math.round(138 + (212 - 138) * t);

      dots.push(
        <View
          key={i}
          style={[
            styles.dotWrapper,
            {
              width: dotSizeScaled,
              height: dotSizeScaled,
              borderRadius: dotSizeScaled / 2,
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

  const orbitContainerSize = orbitRadius * 2 + dotSize;

  const content = (
    <View style={[styles.loaderContent, { width: orbitContainerSize, height: orbitContainerSize }]}>
      {/* Logo – absolutely centered via the sized parent */}
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity },
        ]}
      >
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
            width: orbitContainerSize,
            height: orbitContainerSize,
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
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
  loadingText: {
    marginTop: 20,
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
});
