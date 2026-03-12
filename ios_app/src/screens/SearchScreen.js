import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import apiService from "../api/apiService";

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      setError(null);
      Keyboard.dismiss();

      const data = await apiService.searchByTitle(searchQuery);
      setResults(data || []);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
      const isNetwork =
        err?.isNetworkError || err?.message?.includes("Network");
      setError(
        isNetwork
          ? "Unable to search. Please check your connection."
          : "Search failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMangaTap = (item) => {
    navigation.navigate("MangaDetail", {
      hash: item.hash,
      title: item.title,
      manga: item,
    });
  };

  const renderResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleMangaTap(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.cover_img }} style={styles.cover} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description || "No description"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with search and filter buttons */}
      <View style={styles.headerRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search manga..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => navigation.navigate("TagFilter")}
        >
          <Ionicons name="pricetags" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Button */}
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

      {/* Results */}
      {loading ? (
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#d0368a" />
        </View>
      ) : hasSearched ? (
        error ? (
          <View style={[styles.container, styles.centerContent]}>
            <Ionicons name="cloud-offline" size={48} color="#d0368a" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderResultItem}
            keyExtractor={(item) => item.hash}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={[styles.container, styles.centerContent]}>
            <Ionicons name="search" size={48} color="#ccc" />
            <Text style={styles.noResultsText}>
              No results found for "{searchQuery}"
            </Text>
          </View>
        )
      ) : (
        <View style={[styles.container, styles.centerContent]}>
          <Ionicons name="search" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Search for manga</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1e1e1e",
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: "#d0368a",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    color: "#f5f5f5",
  },
  searchButton: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 10,
    backgroundColor: "#d0368a",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  listContent: {
    padding: 12,
  },
  resultItem: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  cover: {
    width: 100,
    height: 140,
    backgroundColor: "#1e1e1e",
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f5f5f5",
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: "#a0a0a0",
  },
  noResultsText: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#999",
    marginTop: 12,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#d0368a",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
});
