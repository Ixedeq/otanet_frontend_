import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

/**
 * A reusable error view component for displaying network and other errors
 */
export default function NetworkErrorView({
  error,
  onRetry,
  showDownloadsHint = true,
}) {
  const isNetworkError =
    error?.isNetworkError ||
    error?.message?.includes("Network") ||
    error?.message?.toLowerCase()?.includes("internet") ||
    error?.message?.toLowerCase()?.includes("connect");

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={isNetworkError ? "cloud-offline" : "alert-circle"}
          size={64}
          color="#d0368a"
        />
      </View>

      <Text style={styles.title}>
        {isNetworkError ? "No Connection" : "Something Went Wrong"}
      </Text>

      <Text style={styles.message}>
        {isNetworkError
          ? "Please check your internet connection and try again."
          : error?.message || "An unexpected error occurred."}
      </Text>

      {showDownloadsHint && isNetworkError && (
        <Text style={styles.hint}>
          Tip: Downloaded manga is available offline in the Downloads tab.
        </Text>
      )}

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#121212",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(208, 54, 138, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    color: "#708ad4",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d0368a",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
