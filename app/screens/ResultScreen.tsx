import { Animated, View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useNavigation } from '@react-navigation/native';
import { pickRandom, calculateDistance } from '../services/googlePlacesService';
import { useState, useRef, useEffect } from 'react';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseService';
import { COLORS, FONTS, CARD } from '../constants/theme';

export default function ResultScreen() {
    const navigation = useNavigation<any>();
    const { selected, restaurants, setSelected, userLocation } = useAppStore();
    const [isWishlisted, setIsWishlisted] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(40);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();

        const checkWishlist = async () => {
            const uid = auth.currentUser?.uid;
            if (!uid || !selected) return;
            const snap = await getDoc(doc(db, 'users', uid, 'wishlist', selected.id));
            setIsWishlisted(snap.exists());
        };
        checkWishlist();
    }, [selected]);

    if (!selected) {
        return (
            <View style={styles.container}>
                <Text style={FONTS.body}>Ni izbrane restavracije.</Text>
            </View>
        );
    }

    const distance = userLocation
        ? calculateDistance(userLocation.lat, userLocation.lon, selected.lat, selected.lon)
        : null;

    const distanceText = distance
        ? distance < 1000 ? `${Math.round(distance)} m stran` : `${(distance / 1000).toFixed(1)} km stran`
        : null;

    const toggleWishlist = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const ref = doc(db, 'users', uid, 'wishlist', selected.id);
        if (isWishlisted) {
            await deleteDoc(ref);
            setIsWishlisted(false);
        } else {
            await setDoc(ref, { ...selected, addedAt: new Date().toISOString() });
            setIsWishlisted(true);
        }
    };

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                contentContainerStyle={styles.scroll}
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero kartica */}
                <View style={styles.heroCard}>
                    <Text style={styles.restaurantName}>{selected.name}</Text>

                    {selected.cuisine && selected.cuisine.length > 0 && (
                        <View style={styles.cuisineRow}>
                            {selected.cuisine.slice(0, 2).map((c, i) => (
                                <View key={i} style={styles.cuisineBadge}>
                                    <Text style={styles.cuisineBadgeText}>{c.replace(/_restaurant|_house/g, '').replace(/_/g, ' ')}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.statsRow}>
                        {selected.rating && (
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>⭐ {selected.rating.toFixed(1)}</Text>
                                <Text style={styles.statLabel}>Ocena</Text>
                            </View>
                        )}
                        {selected.priceLevel && (
                            <View style={[styles.statItem, styles.statDivider]}>
                                <Text style={styles.statValue}>{selected.priceLevel}</Text>
                                <Text style={styles.statLabel}>Cena</Text>
                            </View>
                        )}
                        {distanceText && (
                            <View style={[styles.statItem, (selected.rating || selected.priceLevel) && styles.statDivider]}>
                                <Text style={styles.statValue}>{distanceText.split(' ')[0]}</Text>
                                <Text style={styles.statLabel}>{distanceText.split(' ').slice(1).join(' ')}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Info kartica */}
                <View style={styles.infoCard}>
                    {selected.address && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}>📍</Text>
                            <Text style={styles.infoText}>{selected.address}</Text>
                        </View>
                    )}
                    {selected.address && selected.openingHours && <View style={styles.infoDivider} />}
                    {selected.openingHours && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}>🕐</Text>
                            <Text style={styles.infoText} numberOfLines={2}>{selected.openingHours}</Text>
                        </View>
                    )}
                </View>

                {/* Akcijski gumbi */}
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => Linking.openURL(`https://maps.google.com/?q=${selected.lat},${selected.lon}`)}
                >
                    <Text style={styles.primaryButtonText}>🗺️  Navigiraj</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => { setSelected(pickRandom(restaurants)); setIsWishlisted(false); }}
                >
                    <Text style={styles.secondaryButtonText}>🎲  Daj mi drugo</Text>
                </TouchableOpacity>

                <View style={styles.bottomRow}>
                    <TouchableOpacity
                        style={styles.halfButton}
                        onPress={() => navigation.navigate('LogVisit', { restaurant: selected })}
                    >
                        <Text style={styles.halfButtonText}>📝  Bil sem tu</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.halfButton, isWishlisted && styles.halfButtonActive]}
                        onPress={toggleWishlist}
                    >
                        <Text style={[styles.halfButtonText, isWishlisted && styles.halfButtonTextActive]}>
                            {isWishlisted ? '📌  Na wishlistu' : '📌  Wishlist'}
                        </Text>
                    </TouchableOpacity>
                </View>

            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: 20, paddingTop: 16, paddingBottom: 40 },

    heroCard: {
        ...CARD,
        marginBottom: 12,
    },
    restaurantName: {
        fontSize: 26,
        fontWeight: '700',
        color: COLORS.textPrimary,
        letterSpacing: -0.3,
        marginBottom: 10,
    },
    cuisineRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    cuisineBadge: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 8,
    },
    cuisineBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },

    statsRow: {
        flexDirection: 'row',
        borderTopWidth: 1, borderTopColor: COLORS.border,
        paddingTop: 14, marginTop: 4,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { borderLeftWidth: 1, borderLeftColor: COLORS.border },
    statValue: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
    statLabel: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },

    infoCard: {
        ...CARD,
        marginBottom: 20,
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    infoIcon: { fontSize: 15, marginTop: 1 },
    infoText: { ...FONTS.callout, flex: 1, lineHeight: 21 },
    infoDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },

    primaryButton: {
        backgroundColor: COLORS.primary, padding: 17,
        borderRadius: 14, alignItems: 'center', marginBottom: 10,
        shadowColor: COLORS.primary, shadowOpacity: 0.3,
        shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5,
    },
    primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },

    secondaryButton: {
        backgroundColor: COLORS.card, padding: 17,
        borderRadius: 14, alignItems: 'center', marginBottom: 10,
        borderWidth: 1.5, borderColor: COLORS.border,
    },
    secondaryButtonText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },

    bottomRow: { flexDirection: 'row', gap: 10 },
    halfButton: {
        flex: 1, padding: 16, borderRadius: 14,
        alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border,
        backgroundColor: COLORS.card,
    },
    halfButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    halfButtonText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
    halfButtonTextActive: { color: 'white' },
});
