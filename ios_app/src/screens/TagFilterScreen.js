import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import apiService from "../api/apiService";

export default function TagFilterScreen({ navigation, route }) {
  const preSelectedTag = route?.params?.preSelectedTag;

  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(
    preSelectedTag ? [preSelectedTag] : []
  );
  const [excludedTags, setExcludedTags] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [isTagsExpanded, setIsTagsExpanded] = useState(!preSelectedTag);

  useEffect(() => {
    loadTags();
  }, []);

  // Auto-search when preSelectedTag is provided
  useEffect(() => {
    const autoSearch = async () => {
      if (preSelectedTag && !loading && selectedTags.includes(preSelectedTag)) {
        try {
          setSearching(true);
          setHasSearched(true);
          const data = await apiService.searchByTags(selectedTags, excludedTags);
          setResults(data || []);
        } catch (error) {
          console.error("Auto-search failed:", error);
          setResults([]);
        } finally {
          setSearching(false);
        }
      }
    };
    autoSearch();
  }, [preSelectedTag, loading]);

  const normalizeTag = (tag, index) => {
    if (typeof tag === "string") {
      return {
        id: tag,
        name: tag,
        value: tag,
      };
    }

    const tagId = tag?.id ?? tag?.value ?? tag?.name ?? tag?.tag ?? index;
    const tagName =
      tag?.name ?? tag?.label ?? tag?.tag ?? tag?.value ?? String(tagId);

    return {
      id: String(tagId),
      name: String(tagName),
      value: tag?.value ?? tag?.id ?? tagName,
    };
  };

  const loadTags = async () => {
    try {
      setLoading(true);
      const tags = await apiService.getAllTags();
      const normalizedTags = Array.isArray(tags)
        ? tags.map((tag, index) => normalizeTag(tag, index))
        : [];
      setAllTags(normalizedTags);
    } catch (error) {
      console.error("Failed to load tags:", error);
      Alert.alert("Error", "Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagValue) => {
    // Cycle: unselected → included → excluded → unselected
    if (selectedTags.includes(tagValue)) {
      // Currently included → move to excluded
      setSelectedTags((prev) => prev.filter((t) => t !== tagValue));
      setExcludedTags((prev) => [...prev, tagValue]);
    } else if (excludedTags.includes(tagValue)) {
      // Currently excluded → remove (unselected)
      setExcludedTags((prev) => prev.filter((t) => t !== tagValue));
    } else {
      // Currently unselected → include
      setSelectedTags((prev) => [...prev, tagValue]);
    }
  };

  const removeTag = (tagValue) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagValue));
    setExcludedTags((prev) => prev.filter((t) => t !== tagValue));
  };

  const handleSearch = async () => {
    if (selectedTags.length === 0 && excludedTags.length === 0) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setSearching(true);
      setHasSearched(true);
      const data = await apiService.searchByTags(selectedTags, excludedTags);
      setResults(data || []);
    } catch (error) {
      console.error("Search failed:", error);
      Alert.alert("Error", "Failed to search by tags");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleMangaTap = (item) => {
    navigation.navigate("MangaDetail", {
      hash: item.hash,
      title: item.title,
      manga: item,
    });
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setExcludedTags([]);
    setResults([]);
    setHasSearched(false);
  };

  const totalSelectedCount = selectedTags.length + excludedTags.length;

  // Filter tags based on search input
  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) {
      return allTags;
    }
    const searchLower = tagSearch.toLowerCase().trim();
    return allTags.filter((tag) =>
      tag.name.toLowerCase().includes(searchLower),
    );
  }, [allTags, tagSearch]);

  // Get selected tag objects for display
  const selectedTagObjects = useMemo(() => {
    return allTags.filter((tag) => selectedTags.includes(tag.value));
  }, [allTags, selectedTags]);

  // Get excluded tag objects for display
  const excludedTagObjects = useMemo(() => {
    return allTags.filter((tag) => excludedTags.includes(tag.value));
  }, [allTags, excludedTags]);

  const renderTagItem = (tag) => {
    const isIncluded = selectedTags.includes(tag.value);
    const isExcluded = excludedTags.includes(tag.value);

    return (
      <TouchableOpacity
        key={tag.id}
        style={[
          styles.tagChip,
          isIncluded && styles.tagChipActive,
          isExcluded && styles.tagChipExcluded,
        ]}
        onPress={() => toggleTag(tag.value)}
      >
        {isIncluded && (
          <Ionicons
            name="add"
            size={12}
            color="#d0368a"
            style={styles.tagIcon}
          />
        )}
        {isExcluded && (
          <Ionicons
            name="remove"
            size={12}
            color="#ff4757"
            style={styles.tagIcon}
          />
        )}
        <Text
          style={[
            styles.tagChipText,
            isIncluded && styles.tagChipTextActive,
            isExcluded && styles.tagChipTextExcluded,
          ]}
        >
          {tag.name}
        </Text>
      </TouchableOpacity>
    );
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#d0368a" />
        <Text style={styles.loadingText}>Loading tags...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tags Section */}
      <View
        style={[
          styles.tagsSection,
          !isTagsExpanded && styles.tagsSectionCollapsed,
        ]}
      >
        <TouchableOpacity
          style={styles.tagsHeader}
          onPress={() => setIsTagsExpanded(!isTagsExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.tagsHeaderLeft}>
            <Ionicons
              name={isTagsExpanded ? "chevron-down" : "chevron-forward"}
              size={20}
              color="#f5f5f5"
              style={styles.expandIcon}
            />
            <Text style={styles.sectionTitle}>Filter by Tags</Text>
            {!isTagsExpanded && totalSelectedCount > 0 && (
              <View style={styles.collapsedBadge}>
                <Text style={styles.collapsedBadgeText}>
                  {totalSelectedCount}
                </Text>
              </View>
            )}
          </View>
          {totalSelectedCount > 0 && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearButtonText}>
                Clear ({totalSelectedCount})
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {isTagsExpanded && (
          <>
            {/* Tag Search Input */}
            <View style={styles.tagSearchContainer}>
              <Ionicons
                name="search"
                size={18}
                color="#666"
                style={styles.tagSearchIcon}
              />
              <TextInput
                style={styles.tagSearchInput}
                placeholder="Search tags..."
                placeholderTextColor="#666"
                value={tagSearch}
                onChangeText={setTagSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {tagSearch.length > 0 && (
                <TouchableOpacity onPress={() => setTagSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {/* Selected Tags */}
            {(selectedTagObjects.length > 0 ||
              excludedTagObjects.length > 0) && (
              <View style={styles.selectedTagsSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedTagsScroll}
                >
                  {selectedTagObjects.length > 0 && (
                    <Text style={styles.selectedTagsLabel}>Include:</Text>
                  )}
                  {selectedTagObjects.map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      style={styles.selectedTagChip}
                      onPress={() => removeTag(tag.value)}
                    >
                      <Ionicons name="add" size={12} color="#fff" />
                      <Text style={styles.selectedTagText}>{tag.name}</Text>
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  ))}
                  {excludedTagObjects.length > 0 && (
                    <Text
                      style={[
                        styles.selectedTagsLabel,
                        selectedTagObjects.length > 0 &&
                          styles.excludeLabelSpacing,
                      ]}
                    >
                      Exclude:
                    </Text>
                  )}
                  {excludedTagObjects.map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      style={styles.excludedTagChip}
                      onPress={() => removeTag(tag.value)}
                    >
                      <Ionicons name="remove" size={12} color="#fff" />
                      <Text style={styles.selectedTagText}>{tag.name}</Text>
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Available Tags Grid */}
            <ScrollView
              style={styles.tagsScrollView}
              contentContainerStyle={styles.tagsGrid}
              showsVerticalScrollIndicator={true}
            >
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => renderTagItem(tag))
              ) : (
                <Text style={styles.noTagsText}>
                  {tagSearch
                    ? "No tags match your search"
                    : "No tags available"}
                </Text>
              )}
            </ScrollView>
          </>
        )}
      </View>

      {/* Search Button */}
      {totalSelectedCount > 0 && (
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.searchButtonText}>
                Search {totalSelectedCount} Tag
                {totalSelectedCount !== 1 ? "s" : ""}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Results */}
      <View style={styles.resultsContainer}>
        {hasSearched && searching ? (
          <View style={[styles.container, styles.centerContent]}>
            <ActivityIndicator size="large" color="#d0368a" />
          </View>
        ) : hasSearched ? (
          results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderResultItem}
              keyExtractor={(item) => item.hash}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={[styles.container, styles.centerContent]}>
              <Ionicons name="search" size={48} color="#555" />
              <Text style={styles.noResultsText}>No manga found</Text>
              <Text style={styles.noResultsSubtext}>
                Try different tags or adjust your filters
              </Text>
            </View>
          )
        ) : (
          <View style={[styles.container, styles.centerContent]}>
            <Ionicons name="pricetags" size={48} color="#555" />
            <Text style={styles.emptyText}>Select tags to get started</Text>
            <Text style={styles.emptySubtext}>
              Choose one or more tags to filter manga
            </Text>
          </View>
        )}
      </View>
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
  tagsSection: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 12,
    backgroundColor: "#1e1e1e",
    maxHeight: 350,
  },
  tagsSectionCollapsed: {
    maxHeight: 60,
  },
  tagsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tagsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandIcon: {
    marginRight: 8,
  },
  collapsedBadge: {
    backgroundColor: "#d0368a",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  collapsedBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f5f5f5",
  },
  clearButtonText: {
    fontSize: 12,
    color: "#d0368a",
    fontWeight: "600",
  },
  tagSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  tagSearchIcon: {
    marginRight: 8,
  },
  tagSearchInput: {
    flex: 1,
    color: "#f5f5f5",
    fontSize: 14,
  },
  selectedTagsSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  selectedTagsLabel: {
    color: "#888",
    fontSize: 12,
    marginRight: 8,
  },
  selectedTagsScroll: {
    gap: 6,
  },
  selectedTagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d0368a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  excludedTagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff4757",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  excludeLabelSpacing: {
    marginLeft: 8,
  },
  selectedTagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  tagsScrollView: {
    maxHeight: 180,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  tagsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 8,
  },
  noTagsText: {
    color: "#666",
    fontSize: 13,
    textAlign: "center",
    width: "100%",
    paddingVertical: 16,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  tagIcon: {
    marginRight: 4,
  },
  tagChipActive: {
    backgroundColor: "rgba(208, 54, 138, 0.25)",
    borderColor: "rgba(208, 54, 138, 0.5)",
  },
  tagChipExcluded: {
    backgroundColor: "rgba(255, 71, 87, 0.25)",
    borderColor: "rgba(255, 71, 87, 0.5)",
  },
  tagChipText: {
    fontSize: 13,
    color: "#a0a0a0",
    fontWeight: "500",
  },
  tagChipTextActive: {
    color: "#d0368a",
  },
  tagChipTextExcluded: {
    color: "#ff4757",
  },
  searchButton: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#d0368a",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: "700",
    color: "#f5f5f5",
    marginTop: 12,
    textAlign: "center",
  },
  noResultsSubtext: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f5f5f5",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  loadingText: {
    color: "#a0a0a0",
    marginTop: 12,
    fontSize: 14,
  },
});
