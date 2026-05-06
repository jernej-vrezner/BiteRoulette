import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { CUISINE_CATEGORIES, fetchRestaurants, pickRandom } from '../services/googlePlacesService';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import RouletteSpinner from '../components/RouletteSpinner';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseService';
import { COLORS, FONTS } from '../constants/theme';

export default function HomeScreen() {
    const { filters, setFilters, setLoading, setError, setRestaurants, setSelected, isLoading, setUserLocation, error } = useAppStore();
    const navigation = useNavigation<any>();
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const toggleCategory = (value: string) => {
        setSelectedCategories(prev =>
            prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
        );
    };

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
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Dovoli dostop do lokacije v nastavitvah.');
                setLoading(false);
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setUserLocation({ lat: latitude, lon: longitude });

            const results = await fetchRestaurants(latitude, longitude, filters);
            if (results.length === 0) {
                setError('Ni restavracij z izbranimi filtri. Poskusi povečati razdaljo ali spremeniti filtre.');
                setLoading(false);
                return;
            }
            const picked = pickRandom(results);
            setRestaurants(results);
            setSelected(picked);
            setLoading(false);
            navigation.navigate('Result');
        } catch (e: any) {
            setLoading(false);
            if (e.message?.includes('Network') || e.message?.includes('fetch')) {
                setError('Ni internetne povezave. Preveri WiFi ali mobilne podatke.');
            } else {
                setError('Prišlo je do napake. Poskusi znova.');
            }
        }
    };

    return (
        <>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>biteRoulette</Text>
                        <Text style={styles.headerSub}>Kaj boš jedel danes?</Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
                            <Text style={styles.iconBtnText}>👤</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => signOut(auth)}>
                            <Text style={styles.iconBtnText}>↩️</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Kategorije */}
                <Text style={styles.sectionLabel}>TIP HRANE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
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

                {/* Podkategorije */}
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

                {/* Izbrani filtri */}
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

                {/* Filters kartica */}
                <View style={styles.filtersCard}>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Razdalja</Text>
                        <Text style={styles.filterValue}>{Math.round(filters.radius)}m</Text>
                    </View>
                    <Slider
                        minimumValue={200}
                        maximumValue={5000}
                        value={filters.radius}
                        step={100}
                        minimumTrackTintColor={COLORS.primary}
                        thumbTintColor={COLORS.primary}
                        maximumTrackTintColor={COLORS.border}
                        onValueChange={(value) => setFilters({ ...filters, radius: value })}
                    />
                    <View style={styles.divider} />
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Odprto zdaj</Text>
                        <Switch
                            value={filters.openNow}
                            trackColor={{ true: COLORS.primary, false: COLORS.border }}
                            thumbColor="white"
                            onValueChange={(value) => setFilters({ ...filters, openNow: value })}
                        />
                    </View>
                </View>

                {/* Error */}
                {error && (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                        <TouchableOpacity onPress={() => setError(null)}>
                            <Text style={styles.errorDismiss}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ZAVRTI */}
                <TouchableOpacity style={styles.spinButton} onPress={handleSpin} activeOpacity={0.85}>
                    <Text style={styles.spinButtonText}>🎰  ZAVRTI</Text>
                </TouchableOpacity>

            </ScrollView>

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
    scroll: { backgroundColor: COLORS.background },
    container: { padding: 24, paddingTop: 64, paddingBottom: 40 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    title: {
        fontSize: 30,
        fontWeight: '700',
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    headerSub: {
        ...FONTS.caption,
        marginTop: 2,
    },
    headerButtons: { flexDirection: 'row', gap: 8, marginTop: 4 },
    iconBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: COLORS.card,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
        elevation: 2,
    },
    iconBtnText: { fontSize: 17 },

    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textTertiary,
        letterSpacing: 1,
        marginBottom: 10,
    },
    chipScroll: { marginBottom: 12 },
    categoryChip: {
        paddingHorizontal: 16, paddingVertical: 9,
        borderRadius: 20, borderWidth: 1.5,
        borderColor: COLORS.border,
        marginRight: 8, backgroundColor: COLORS.card,
    },
    categoryChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
    categoryTextSelected: { color: 'white' },

    subcategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 14, borderWidth: 1.5,
        borderColor: COLORS.border, backgroundColor: COLORS.card,
    },
    chipSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
    chipText: { color: COLORS.textSecondary, fontWeight: '500', fontSize: 13 },
    chipTextSelected: { color: COLORS.primary, fontWeight: '600' },

    selectedRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        padding: 10, borderRadius: 10, marginBottom: 16, gap: 4,
    },
    selectedLabel: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
    selectedValue: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },
    clearText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },

    filtersCard: {
        backgroundColor: COLORS.card, borderRadius: 16, padding: 20,
        marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    filterLabel: { ...FONTS.body, fontWeight: '500' },
    filterValue: { ...FONTS.body, color: COLORS.primary, fontWeight: '600' },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },

    errorCard: {
        backgroundColor: '#FFF1F0', borderWidth: 1.5, borderColor: '#FFCCC7',
        borderRadius: 12, padding: 14, flexDirection: 'row',
        alignItems: 'center', marginBottom: 12, gap: 10,
    },
    errorText: { flex: 1, color: COLORS.error, fontSize: 14, lineHeight: 20 },
    errorDismiss: { color: COLORS.error, fontSize: 18, fontWeight: 'bold' },

    spinButton: {
        backgroundColor: COLORS.primary, padding: 18,
        borderRadius: 16, alignItems: 'center', marginTop: 8,
        shadowColor: COLORS.primary, shadowOpacity: 0.35,
        shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    spinButtonText: { color: 'white', fontSize: 18, fontWeight: '700', letterSpacing: 1 },

    loadingOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: COLORS.background,
        justifyContent: 'center', alignItems: 'center',
    },
    loadingText: { ...FONTS.callout, marginTop: 16 },
});
