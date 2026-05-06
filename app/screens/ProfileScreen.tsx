import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseService';
import { Visit } from '../types/restaurant';

// Vse kuhinje iz app-a — za bitePassport
const ALL_CUISINES = [
    { value: 'italian_restaurant',       label: '🇮🇹 Italijanska' },
    { value: 'mediterranean_restaurant', label: '🫒 Mediteranska' },
    { value: 'greek_restaurant',         label: '🇬🇷 Grška' },
    { value: 'spanish_restaurant',       label: '🇪🇸 Španska' },
    { value: 'french_restaurant',        label: '🇫🇷 Francoska' },
    { value: 'japanese_restaurant',      label: '🇯🇵 Japonska' },
    { value: 'sushi_restaurant',         label: '🍣 Sushi' },
    { value: 'ramen_restaurant',         label: '🍜 Ramen' },
    { value: 'chinese_restaurant',       label: '🇨🇳 Kitajska' },
    { value: 'thai_restaurant',          label: '🇹🇭 Tajska' },
    { value: 'indian_restaurant',        label: '🇮🇳 Indijska' },
    { value: 'korean_restaurant',        label: '🇰🇷 Korejska' },
    { value: 'vietnamese_restaurant',    label: '🇻🇳 Vietnamska' },
    { value: 'hamburger_restaurant',     label: '🍔 Burger' },
    { value: 'barbecue_restaurant',      label: '🥩 BBQ' },
    { value: 'mexican_restaurant',       label: '🇲🇽 Mehiška' },
    { value: 'brazilian_restaurant',     label: '🇧🇷 Brazilska' },
    { value: 'steak_house',              label: '🥩 Steak' },
    { value: 'vegetarian_restaurant',    label: '🥗 Vegetarijansko' },
    { value: 'vegan_restaurant',         label: '🌱 Vegansko' },
    { value: 'seafood_restaurant',       label: '🦞 Morska hrana' },
    { value: 'breakfast_restaurant',     label: '🍳 Zajtrk/Brunch' },
    { value: 'pizza_restaurant',         label: '🍕 Pizza' },
    { value: 'fast_food_restaurant',     label: '🍟 Hitra hrana' },
];

type Tab = 'statistike' | 'passport' | 'zgodovina' | 'wishlist';

interface WishlistItem {
    id: string;
    name: string;
    address?: string;
    cuisine?: string[];
    rating?: number;
    addedAt: string;
}

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<Tab>('statistike');
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                setLoading(true);
                const uid = auth.currentUser?.uid;
                if (!uid) return;

                // Obiski
                const q = query(
                    collection(db, 'users', uid, 'visits'),
                    orderBy('visitedAt', 'desc')
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visit));
                setVisits(data);

                // Wishlist
                const wSnap = await getDocs(collection(db, 'users', uid, 'wishlist'));
                const wData = wSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WishlistItem));
                wData.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
                setWishlist(wData);

                setLoading(false);
            };
            fetchData();
        }, [])
    );

    const handleDeleteWishlist = async (item: WishlistItem) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        await deleteDoc(doc(db, 'users', uid, 'wishlist', item.id));
        setWishlist(prev => prev.filter(w => w.id !== item.id));
    };

    const handleDelete = (visit: Visit) => {
        Alert.alert(
            'Izbriši obisk',
            `Zares želiš izbrisati obisk v "${visit.restaurantName}"?`,
            [
                { text: 'Prekliči', style: 'cancel' },
                {
                    text: 'Izbriši', style: 'destructive',
                    onPress: async () => {
                        const uid = auth.currentUser?.uid;
                        if (!uid || !visit.id) return;
                        await deleteDoc(doc(db, 'users', uid, 'visits', visit.id));
                        setVisits(prev => prev.filter(v => v.id !== visit.id));
                        setExpandedId(null);
                    },
                },
            ]
        );
    };

    // Izračun statistik
    const totalSpent = visits.reduce((sum, v) => sum + (v.amountSpent || 0), 0);
    const avgRating = (key: keyof Visit['ratings']) => {
        const withRatings = visits.filter(v => v.ratings);
        if (withRatings.length === 0) return 0;
        const sum = withRatings.reduce((s, v) => s + (v.ratings[key] || 0), 0);
        return sum / withRatings.length;
    };

    // Najljubša kuhinja
    const cuisineCount: Record<string, number> = {};
    visits.forEach(v => {
        v.cuisine?.forEach(c => {
            cuisineCount[c] = (cuisineCount[c] || 0) + 1;
        });
    });
    const favCuisineKey = Object.entries(cuisineCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const favCuisine = ALL_CUISINES.find(c => c.value === favCuisineKey)?.label ?? favCuisineKey ?? '—';

    // bitePassport — katere kuhinje si že obiskal
    const visitedCuisines = new Set(visits.flatMap(v => v.cuisine ?? []));

    const renderStars = (value: number) => {
        const rounded = Math.round(value);
        return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' });

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>👤 Profil</Text>
            <Text style={styles.email}>{auth.currentUser?.email}</Text>

            {/* Tabs */}
            <View style={styles.tabs}>
                {([
                    { key: 'statistike', emoji: '📊', label: 'Stats' },
                    { key: 'passport',   emoji: '🗺️', label: 'Passport' },
                    { key: 'zgodovina',  emoji: '📋', label: 'Zgodovina' },
                    { key: 'wishlist',   emoji: '📌', label: 'Wishlist' },
                ] as { key: Tab; emoji: string; label: string }[]).map(({ key, emoji, label }) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.tab, activeTab === key && styles.tabActive]}
                        onPress={() => setActiveTab(key)}
                    >
                        <Text style={[styles.tabEmoji]}>{emoji}</Text>
                        <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* STATISTIKE */}
                {activeTab === 'statistike' && (
                    <View style={styles.section}>
                        {visits.length === 0 ? (
                            <Text style={styles.empty}>Še nimaš zabeleženih obiskov.</Text>
                        ) : (
                            <>
                                <View style={styles.statsGrid}>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statNumber}>{visits.length}</Text>
                                        <Text style={styles.statLabel}>Obiskov</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statNumber}>€{totalSpent.toFixed(0)}</Text>
                                        <Text style={styles.statLabel}>Porabljeno</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statNumber}>€{(totalSpent / visits.length).toFixed(0)}</Text>
                                        <Text style={styles.statLabel}>Povprečen obisk</Text>
                                    </View>
                                </View>

                                <Text style={styles.sectionTitle}>Povprečne ocene</Text>
                                {[
                                    { key: 'hrana' as const,     label: '🍽️ Hrana' },
                                    { key: 'pijaca' as const,    label: '🥤 Pijača' },
                                    { key: 'postrezba' as const, label: '🤵 Postrežba' },
                                    { key: 'ambient' as const,   label: '✨ Ambient' },
                                ].map(({ key, label }) => (
                                    <View key={key} style={styles.ratingRow}>
                                        <Text style={styles.ratingLabel}>{label}</Text>
                                        <Text style={styles.ratingStars}>{renderStars(avgRating(key))}</Text>
                                        <Text style={styles.ratingNum}>{avgRating(key).toFixed(1)}</Text>
                                    </View>
                                ))}

                                <Text style={styles.sectionTitle}>Najljubša kuhinja</Text>
                                <Text style={styles.favCuisine}>{favCuisine}</Text>
                            </>
                        )}
                    </View>
                )}

                {/* BITEPASSPORT */}
                {activeTab === 'passport' && (
                    <View style={styles.section}>
                        <Text style={styles.passportHeader}>
                            {visitedCuisines.size} / {ALL_CUISINES.length} kuhinj odkritih
                        </Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${(visitedCuisines.size / ALL_CUISINES.length) * 100}%` }]} />
                        </View>
                        <View style={styles.passportGrid}>
                            {ALL_CUISINES.map(c => {
                                const visited = visitedCuisines.has(c.value);
                                return (
                                    <View key={c.value} style={[styles.passportChip, visited && styles.passportChipVisited]}>
                                        <Text style={[styles.passportChipText, visited && styles.passportChipTextVisited]}>
                                            {visited ? '✅ ' : '🔒 '}{c.label}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* ZGODOVINA */}
                {activeTab === 'zgodovina' && (
                    <View style={styles.section}>
                        {visits.length === 0 ? (
                            <Text style={styles.empty}>Še nimaš zabeleženih obiskov.</Text>
                        ) : (
                            visits.map(v => {
                                const isExpanded = expandedId === v.id;
                                const avgScore = v.ratings
                                    ? ((v.ratings.hrana + v.ratings.pijaca + v.ratings.postrezba + v.ratings.ambient) / 4).toFixed(1)
                                    : '—';
                                return (
                                    <TouchableOpacity
                                        key={v.id}
                                        style={styles.visitCard}
                                        onPress={() => setExpandedId(isExpanded ? null : (v.id ?? null))}
                                        activeOpacity={0.8}
                                    >
                                        {/* Vedno vidno */}
                                        <View style={styles.visitHeader}>
                                            <Text style={styles.visitName}>{v.restaurantName}</Text>
                                            <Text style={styles.visitDate}>{formatDate(v.visitedAt)}</Text>
                                        </View>
                                        <View style={styles.visitFooter}>
                                            <Text style={styles.visitRating}>★ {avgScore}</Text>
                                            {v.amountSpent > 0 && (
                                                <Text style={styles.visitAmount}>€{v.amountSpent.toFixed(2)}</Text>
                                            )}
                                            <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                                        </View>

                                        {/* Razširjeno */}
                                        {isExpanded && (
                                            <View style={styles.expandedContent}>
                                                {v.dishesEaten?.length > 0 && (
                                                    <View style={styles.detailRow}>
                                                        <Text style={styles.detailLabel}>🍽️ Jedel/a</Text>
                                                        <Text style={styles.detailValue}>{v.dishesEaten.join(', ')}</Text>
                                                    </View>
                                                )}
                                                {v.ratings && (
                                                    <>
                                                        {[
                                                            { key: 'hrana' as const,     label: '🍽️ Hrana' },
                                                            { key: 'pijaca' as const,    label: '🥤 Pijača' },
                                                            { key: 'postrezba' as const, label: '🤵 Postrežba' },
                                                            { key: 'ambient' as const,   label: '✨ Ambient' },
                                                        ].map(({ key, label }) => (
                                                            <View key={key} style={styles.detailRow}>
                                                                <Text style={styles.detailLabel}>{label}</Text>
                                                                <Text style={styles.detailStars}>
                                                                    {'★'.repeat(v.ratings[key])}{'☆'.repeat(5 - v.ratings[key])}
                                                                </Text>
                                                            </View>
                                                        ))}
                                                    </>
                                                )}
                                                {v.notes && (
                                                    <Text style={styles.visitNotes}>"{v.notes}"</Text>
                                                )}
                                                <View style={styles.actionRow}>
                                                    <TouchableOpacity
                                                        style={styles.editBtn}
                                                        onPress={() => navigation.navigate('LogVisit', { visit: v })}
                                                    >
                                                        <Text style={styles.editBtnText}>✏️ Uredi</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.deleteBtn}
                                                        onPress={() => handleDelete(v)}
                                                    >
                                                        <Text style={styles.deleteBtnText}>🗑️ Izbriši</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                )}
                {/* WISHLIST */}
                {activeTab === 'wishlist' && (
                    <View style={styles.section}>
                        {wishlist.length === 0 ? (
                            <Text style={styles.empty}>Твoj wishlist je prazen.{'\n'}Na zaslonu z rezultati klikni 📌 da dodaš restavracijo.</Text>
                        ) : (
                            wishlist.map(item => (
                                <View key={item.id} style={styles.visitCard}>
                                    <View style={styles.visitHeader}>
                                        <Text style={styles.visitName}>{item.name}</Text>
                                        <TouchableOpacity onPress={() => handleDeleteWishlist(item)}>
                                            <Text style={styles.wishlistRemove}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {item.address && (
                                        <Text style={styles.wishlistAddress}>📍 {item.address}</Text>
                                    )}
                                    {item.cuisine && item.cuisine.length > 0 && (
                                        <Text style={styles.visitDishes}>{item.cuisine.join(', ')}</Text>
                                    )}
                                    {item.rating && (
                                        <Text style={styles.visitRating}>⭐ {item.rating.toFixed(1)}</Text>
                                    )}
                                </View>
                            ))
                        )}
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, paddingTop: 60 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold' },
    email: { fontSize: 14, color: '#999', marginBottom: 20, marginTop: 4 },
    tabs: { flexDirection: 'row', marginBottom: 20, gap: 6 },
    tab: {
        flex: 1, paddingVertical: 10, borderRadius: 10,
        borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center',
    },
    tabActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
    tabEmoji: { fontSize: 16, marginBottom: 2 },
    tabText: { fontSize: 10, fontWeight: '600', color: '#999' },
    tabTextActive: { color: 'white' },
    section: { paddingBottom: 40 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12, color: '#333' },
    empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
    statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    statCard: {
        flex: 1, backgroundColor: '#FFF0EB', borderRadius: 12,
        padding: 14, alignItems: 'center',
    },
    statNumber: { fontSize: 22, fontWeight: 'bold', color: '#FF6B35' },
    statLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    ratingLabel: { width: 110, fontSize: 14, color: '#333' },
    ratingStars: { fontSize: 16, color: '#FF6B35', flex: 1 },
    ratingNum: { fontSize: 14, fontWeight: '600', color: '#333' },
    favCuisine: { fontSize: 22, fontWeight: 'bold', color: '#FF6B35' },
    passportHeader: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#333' },
    progressBarBg: { height: 8, backgroundColor: '#eee', borderRadius: 4, marginBottom: 20 },
    progressBarFill: { height: 8, backgroundColor: '#FF6B35', borderRadius: 4 },
    passportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    passportChip: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd',
        backgroundColor: '#f9f9f9',
    },
    passportChipVisited: { borderColor: '#FF6B35', backgroundColor: '#FFF0EB' },
    passportChipText: { fontSize: 13, color: '#aaa' },
    passportChipTextVisited: { color: '#FF6B35', fontWeight: '600' },
    visitCard: {
        backgroundColor: 'white', borderRadius: 14, padding: 16,
        marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06,
        shadowRadius: 8, elevation: 2,
    },
    visitHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    visitName: { fontSize: 16, fontWeight: '700', flex: 1 },
    visitDate: { fontSize: 12, color: '#999' },
    visitDishes: { fontSize: 13, color: '#555', marginBottom: 8 },
    visitFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    visitRating: { fontSize: 14, color: '#FF6B35', fontWeight: '600' },
    visitAmount: { fontSize: 14, color: '#555' },
    visitNotes: { fontSize: 13, color: '#888', fontStyle: 'italic', marginTop: 8 },
    expandIcon: { fontSize: 12, color: '#bbb', marginLeft: 8 },
    expandedContent: { borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 12, paddingTop: 12 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    detailLabel: { fontSize: 13, color: '#888', flex: 1 },
    detailValue: { fontSize: 13, color: '#333', flex: 2, textAlign: 'right' },
    detailStars: { fontSize: 14, color: '#FF6B35' },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    wishlistRemove: { fontSize: 16, color: '#bbb', fontWeight: 'bold', padding: 4 },
    wishlistAddress: { fontSize: 13, color: '#888', marginTop: 4 },
    editBtn: {
        flex: 1, borderWidth: 1.5, borderColor: '#FF6B35',
        borderRadius: 10, padding: 10, alignItems: 'center',
    },
    editBtnText: { color: '#FF6B35', fontWeight: '600', fontSize: 14 },
    deleteBtn: {
        flex: 1, borderWidth: 1.5, borderColor: '#e53935',
        borderRadius: 10, padding: 10, alignItems: 'center',
    },
    deleteBtnText: { color: '#e53935', fontWeight: '600', fontSize: 14 },
});
