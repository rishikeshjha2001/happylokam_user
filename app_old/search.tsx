import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/constants/theme';

export default function Search() {
  const router = useRouter();
  
  const results = Array.from({ length: 10 }, (_, i) => ({
    id: String(i + 1),
    title: `Venue ${i + 1}`,
    location: 'Kochi, Kerala',
    price: `₹${(i + 1) * 10000}`
  }));

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search..."
          autoFocus
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.resultItem}
            onPress={() => router.push(`/listing/${item.id}`)}
          >
            <View style={styles.resultImage} />
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{item.title}</Text>
              <Text style={styles.resultLocation}>{item.location}</Text>
              <Text style={styles.resultPrice}>{item.price}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchHeader: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resultImage: {
    width: 100,
    height: 100,
    backgroundColor: theme.colors.surface,
  },
  resultInfo: {
    flex: 1,
    padding: theme.spacing.sm,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  resultLocation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginVertical: 4,
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  }
});
