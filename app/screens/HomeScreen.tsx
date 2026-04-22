import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { CUISINE_CATEGORIES, fetchRestaurants, pickRandom } from '../services/googlePlacesService';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import RouletteSpinner from '../components/RouletteSpinner';
import { useState } from 'react';

export default function HomeScreen() {
    const { filters, setFilters, setLoading, setError, setRestaurants, setSelected, isLoading, setUserLocation } = useAppStore();
    const navigation = useNavigation<any>();

    // Izbrane kategorije (seznam)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const toggleCategory = (value: string) => {
        setSelectedCategories(prev =>
            prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
        );
    };

    // Vse podkategorije iz vseh izbranih kategorij
    const activeOptions = CUISINE_CATEGORIES
        .filter(c => selectedCategories.includes(c.value))
        .flatMap(c => c.options);

    const toggleCuisine = (value: string) => {
        const isSelected = filters.cuisines.includes(value);
        const updated = isSelected
            ? filters.cuisines.filter(c => c !== value)
            : [...filters.cuisines, value];
        setFilters({ ...filters, cuisines: updated });
    };

    const handleSpin = async () => {
        setLoading(true);
        setError(null);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setError('Dovoli dostop do lokacije!');
            setLoading(false);
            return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setUserLocation({ lat: latitude, lon: longitude });

        const results = await fetchRestaurants(latitude, longitude, filters);
        const picked = pickRandom(results);

        setRestaurants(results);
        setSelected(picked);
        setLoading(false);

        navigation.navigate('Result');
    };

    return (
        <>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>🎰 biteRoulette</Text>

                {/* Kategorije */}
                <Text style={styles.sectionTitle}>Tip hrane</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {CUISINE_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.value}
                            style={[styles.categoryChip, selectedCategories.includes(cat.value) && styles.categoryChipSelected]}
                            onPress={() => toggleCategory(cat.value)}
                        >
                            <Text style={[styles.categoryText, selectedCategories.includes(cat.value) && styles.categoryTextSelected]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Podkategorije — prikažejo se samo ko je vsaj ena kategorija izbrana */}
                {activeOptions.length > 0 && (
                    <View style={styles.subcategoryGrid}>
                        {activeOptions.map((option, index) => {
                            const isSelected = filters.cuisines.includes(option.value);
                            return (
                                <TouchableOpacity
                                    key={`${option.value}-${index}`}
                                    style={[styles.chip, isSelected && styles.chipSelected]}
                                    onPress={() => toggleCuisine(option.value)}
                                >
                                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Prikaz izbranih filtrov */}
                {filters.cuisines.length > 0 && (
                    <View style={styles.selectedRow}>
                        <Text style={styles.selectedLabel}>Izbrano: </Text>
                        <Text style={styles.selectedValue} numberOfLines={1}>
                            {filters.cuisines.map(c => {
                                for (const cat of CUISINE_CATEGORIES) {
                                    const found = cat.options.find(o => o.value === c);
                                    if (found) return found.label;
                                }
                                return c;
                            }).join(', ')}
                        </Text>
                        <TouchableOpacity onPress={() => setFilters({ ...filters, cuisines: [] })}>
                            <Text style={styles.clearText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Razdalja */}
                <Text style={styles.sectionTitle}>
                    Razdalja: {Math.round(filters.radius)}m
                </Text>
                <Slider
                    minimumValue={200}
                    maximumValue={5000}
                    value={filters.radius}
                    step={100}
                    minimumTrackTintColor="#FF6B35"
                    thumbTintColor="#FF6B35"
                    onValueChange={(value) => setFilters({ ...filters, radius: value })}
                />

                {/* Odprto zdaj */}
                <View style={styles.switchRow}>
                    <Text style={styles.sectionTitle}>Odprto zdaj</Text>
                    <Switch
                        value={filters.openNow}
                        trackColor={{ true: '#FF6B35' }}
                        onValueChange={(value) => setFilters({ ...filters, openNow: value })}
                    />
                </View>

                {/* ZAVRTI gumb */}
                <TouchableOpacity style={styles.button} onPress={handleSpin}>
                    <Text style={styles.buttonText}>🎰 ZAVRTI</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Shranjene */}
            <TouchableOpacity
                style={styles.savedButton}
                onPress={() => navigation.navigate('Saved')}
            >
                <Text style={styles.savedButtonText}>💾 Shranjene restavracije</Text>
            </TouchableOpacity>

            {/* Loading overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <RouletteSpinner />
                    <Text style={styles.loadingText}>Iščem restavracijo...</Text>
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 8,
    },
    // Horizontalni scroll za kategorije
    categoryScroll: {
        marginBottom: 16,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FF6B35',
        marginRight: 8,
    },
    categoryChipSelected: {
        backgroundColor: '#FF6B35',
    },
    categoryText: {
        color: '#FF6B35',
        fontWeight: '600',
        fontSize: 14,
    },
    categoryTextSelected: {
        color: 'white',
    },
    // Podkategorije
    subcategoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#FF6B35',
    },
    chipSelected: {
        backgroundColor: '#FF6B35',
    },
    chipText: {
        color: '#FF6B35',
        fontWeight: '500',
        fontSize: 13,
    },
    chipTextSelected: {
        color: 'white',
    },
    // Izbrani filtri
    selectedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0EB',
        padding: 10,
        borderRadius: 10,
        marginBottom: 16,
        gap: 4,
    },
    selectedLabel: {
        color: '#FF6B35',
        fontWeight: '600',
        fontSize: 13,
    },
    selectedValue: {
        color: '#555',
        fontSize: 13,
        flex: 1,
    },
    clearText: {
        color: '#FF6B35',
        fontWeight: 'bold',
        fontSize: 16,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    button: {
        backgroundColor: '#FF6B35',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
        marginTop: 16,
        color: '#555',
    },
    savedButton: {
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'white',
    },
    savedButtonText: {
        color: '#FF6B35',
        fontSize: 15,
        fontWeight: '500',
    },
});
