import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Platform, Alert,
    TouchableWithoutFeedback, Keyboard
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseService';
import { Visit, VisitRatings } from '../types/restaurant';

const RATING_CATEGORIES: { key: keyof VisitRatings; label: string; emoji: string }[] = [
    { key: 'hrana',     label: 'Hrana',     emoji: '🍽️' },
    { key: 'pijaca',    label: 'Pijača',    emoji: '🥤' },
    { key: 'postrezba', label: 'Postrežba', emoji: '🤵' },
    { key: 'ambient',   label: 'Ambient',   emoji: '✨' },
];

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => onChange(star)}>
                    <Text style={[styles.star, star <= value && styles.starSelected]}>★</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

export default function LogVisitScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const restaurant = route.params?.restaurant;
    const existingVisit: Visit | undefined = route.params?.visit;
    const isEditing = !!existingVisit;

    const [ratings, setRatings] = useState<VisitRatings>(
        existingVisit?.ratings ?? { hrana: 0, pijaca: 0, postrezba: 0, ambient: 0 }
    );
    const [amount, setAmount] = useState(existingVisit?.amountSpent?.toString() ?? '');
    const [dishes, setDishes] = useState<string[]>(existingVisit?.dishesEaten ?? ['']);
    const [notes, setNotes] = useState(existingVisit?.notes ?? '');
    const [date, setDate] = useState(existingVisit ? new Date(existingVisit.visitedAt) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);

    const setRating = (key: keyof VisitRatings, value: number) => {
        setRatings(prev => ({ ...prev, [key]: value }));
    };

    const updateDish = (index: number, value: string) => {
        setDishes(prev => prev.map((d, i) => i === index ? value : d));
    };

    const addDish = () => setDishes(prev => [...prev, '']);

    const removeDish = (index: number) => {
        if (dishes.length === 1) return;
        setDishes(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        const allRated = Object.values(ratings).every(r => r > 0);
        if (!allRated) {
            Alert.alert('Ocene', 'Prosim oceni vse kategorije.');
            return;
        }
        const filledDishes = dishes.filter(d => d.trim());
        if (filledDishes.length === 0) {
            Alert.alert('Manjka podatek', 'Vpiši vsaj eno jed.');
            return;
        }

        setSaving(true);
        try {
            const uid = auth.currentUser?.uid;
            if (!uid) throw new Error('Nisi prijavljen.');

            const visitData = {
                ratings,
                amountSpent: parseFloat(amount) || 0,
                dishesEaten: filledDishes,
                visitedAt: date.toISOString(),
                notes: notes.trim() || null,
            };

            if (isEditing && existingVisit.id) {
                // Posodobi obstoječ obisk
                await updateDoc(doc(db, 'users', uid, 'visits', existingVisit.id), visitData);
            } else {
                // Ustvari novega
                await addDoc(collection(db, 'users', uid, 'visits'), {
                    ...visitData,
                    restaurantId: restaurant?.id ?? 'unknown',
                    restaurantName: restaurant?.name ?? 'Neznana restavracija',
                    address: restaurant?.address,
                    cuisine: restaurant?.cuisine,
                    createdAt: new Date().toISOString(),
                });
            }

            navigation.goBack();
        } catch (e) {
            Alert.alert('Napaka', 'Shranjevanje ni uspelo. Poskusi znova.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (d: Date) =>
        d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' });

    const restaurantName = isEditing ? existingVisit.restaurantName : restaurant?.name;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>{isEditing ? 'Uredi obisk' : 'Zabeleži obisk'}</Text>
                {restaurantName && (
                    <Text style={styles.restaurantName}>{restaurantName}</Text>
                )}

                {/* 4 ocene */}
                {RATING_CATEGORIES.map(({ key, label, emoji }) => (
                    <View key={key} style={styles.ratingRow}>
                        <Text style={styles.ratingLabel}>{emoji} {label}</Text>
                        <StarRow value={ratings[key]} onChange={(v) => setRating(key, v)} />
                    </View>
                ))}

                {/* Kaj si jedel */}
                <Text style={styles.label}>Kaj si jedel/a</Text>
                {dishes.map((dish, index) => (
                    <View key={index} style={styles.dishRow}>
                        <TextInput
                            style={[styles.input, styles.dishInput]}
                            placeholder={`Jed ${index + 1}`}
                            value={dish}
                            onChangeText={(v) => updateDish(index, v)}
                        />
                        {dishes.length > 1 && (
                            <TouchableOpacity onPress={() => removeDish(index)} style={styles.removeBtn}>
                                <Text style={styles.removeBtnText}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                <TouchableOpacity onPress={addDish} style={styles.addDishBtn}>
                    <Text style={styles.addDishText}>+ Dodaj jed</Text>
                </TouchableOpacity>

                {/* Znesek */}
                <Text style={styles.label}>Znesek (€)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="npr. 18.50"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                />

                {/* Datum */}
                <Text style={styles.label}>Datum obiska</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.dateText}>📅 {formatDate(date)}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        maximumDate={new Date()}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_, selectedDate) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (selectedDate) setDate(selectedDate);
                        }}
                    />
                )}

                {/* Opomba */}
                <Text style={styles.label}>Opomba <Text style={styles.optional}>(opcijsko)</Text></Text>
                <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    placeholder="Kako je bilo? Bi šel/šla nazaj?"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                />

                <TouchableOpacity
                    style={[styles.button, saving && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.buttonText}>
                        {saving ? 'Shranjujem...' : isEditing ? '✏️ Posodobi obisk' : '💾 Shrani obisk'}
                    </Text>
                </TouchableOpacity>

                {!isEditing && (
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.skip}>Preskoči</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
    restaurantName: { fontSize: 16, color: '#FF6B35', marginBottom: 24 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    ratingLabel: { fontSize: 15, fontWeight: '600', color: '#333', width: 110 },
    starsRow: { flexDirection: 'row', gap: 4 },
    star: { fontSize: 32, color: '#ddd' },
    starSelected: { color: '#FF6B35' },
    label: { fontSize: 15, fontWeight: '600', marginBottom: 8, marginTop: 16, color: '#333' },
    optional: { fontWeight: '400', color: '#999' },
    dishRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    dishInput: { flex: 1, marginBottom: 0 },
    removeBtn: { padding: 10 },
    removeBtnText: { color: '#FF6B35', fontSize: 16, fontWeight: 'bold' },
    addDishBtn: { marginTop: 4, paddingVertical: 8 },
    addDishText: { color: '#FF6B35', fontWeight: '600', fontSize: 14 },
    input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 4 },
    inputMultiline: { height: 90, textAlignVertical: 'top' },
    dateButton: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14 },
    dateText: { fontSize: 15, color: '#333' },
    button: { backgroundColor: '#FF6B35', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    skip: { textAlign: 'center', color: '#999', marginTop: 16, fontSize: 15 },
});
