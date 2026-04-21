import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { CUISINE_OPTIONS, fetchRestaurants, pickRandom } from '../services/overpassService';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import RouletteSpinner from '../components/RouletteSpinner';

export default function HomeScreen() {
    const { filters, setFilters, setLoading, setError, setRestaurants, setSelected, isLoading, setUserLocation } = useAppStore();
    const navigation = useNavigation<any>();

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
                <Text style={styles.sectionTitle}>Tip hrane</Text>
                <View style={styles.cuisineGrid}>
                    {CUISINE_OPTIONS.map((cuisine) => {
                        const isSelected = filters.cuisines.includes(cuisine.value);
                        return (
                            <TouchableOpacity
                                key={cuisine.value}
                                style={[styles.chip, isSelected && styles.chipSelected]}
                                onPress={() => toggleCuisine(cuisine.value)}
                            >
                                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                    {cuisine.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <Text style={styles.sectionTitle}>
                    Razdalja: {Math.round(filters.radius)}m
                </Text>
                <Slider
                    minimumValue={200}
                    maximumValue={5000}
                    value={filters.radius}
                    step={100}
                    onValueChange={(value) => setFilters({ ...filters, radius: value })}
                />
                <View style={styles.switchRow}>
                    <Text style={styles.sectionTitle}>Odprto zdaj</Text>
                    <Switch
                        value={filters.openNow}
                        onValueChange={(value) => setFilters({ ...filters, openNow: value })}
                    />
                </View>
                <TouchableOpacity style={styles.button} onPress={handleSpin}>
                    <Text style={styles.buttonText}>🎰 ZAVRTI</Text>
                </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity 
                style={styles.savedButton}
                onPress={() => navigation.navigate('Saved')}
            >
                <Text style={styles.savedButtonText}>💾 Shranjene restavracije</Text>
            </TouchableOpacity>

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
    },
    cuisineGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 32,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FF6B35',
    },
    chipSelected: {
        backgroundColor: '#FF6B35',
    },
    chipText: {
        color: '#FF6B35',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: 'white',
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
        marginTop: 16,
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
    marginTop: 16,
    padding: 12,
    },
    savedButtonText: {
        color: '#FF6B35',
        fontSize: 15,
        fontWeight: '500',
    },
});
