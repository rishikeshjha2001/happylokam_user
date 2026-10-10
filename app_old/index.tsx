import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/constants/theme';

export default function Home() {
  const router = useRouter();

  const categories = ['Wedding', 'Birthday', 'Corporate', 'Anniversary', 'Party'];
  const popularVenues = [1, 2, 3, 4];
  const cities = ['Kochi', 'Trivandrum', 'Calicut', 'Thrissur'];

  return (
    <ScrollView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search venues, decorators..."
          onFocus={() => router.push('/search')}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((cat, index) => (
          <TouchableOpacity key={index} style={styles.categoryChip}>
            <Text style={styles.categoryText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Popular Venues */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Venues</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {popularVenues.map((item) => (
            <TouchableOpacity 
              key={item} 
              style={styles.card}
              onPress={() => router.push(`/listing/${item}`)}
            >
              <View style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Grand Palace {item}</Text>
                <Text style={styles.cardSubtitle}>Kochi</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Explore by City */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore by City</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {cities.map((city, index) => (
            <TouchableOpacity key={index} style={styles.cityCard}>
              <View style={styles.cityImage} />
              <Text style={styles.cityText}>{city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  searchInput: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  categoriesContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  categoryChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  card: {
    width: 200,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardImage: {
    height: 120,
    backgroundColor: theme.colors.surface,
  },
  cardContent: {
    padding: theme.spacing.sm,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.colors.text,
  },
  cardSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  cityCard: {
    marginRight: theme.spacing.md,
    alignItems: 'center',
  },
  cityImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  cityText: {
    fontWeight: '500',
    color: theme.colors.text,
  }
});
