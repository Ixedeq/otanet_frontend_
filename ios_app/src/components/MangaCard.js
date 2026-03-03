import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";

export default function MangaCard({ manga, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(manga)}>
      <Image source={{ uri: manga.coverUrl }} style={styles.cover} />
      <View style={styles.info}>
        <Text style={styles.title}>{manga.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    margin: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 2,
  },
  cover: {
    width: "100%",
    height: 180,
  },
  info: {
    padding: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
