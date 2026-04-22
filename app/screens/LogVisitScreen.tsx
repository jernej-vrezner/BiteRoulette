import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Platform, Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseService';
import { Visit } from '../types/restaurant';

export default function LogVisitScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const restaurant = route.params?.restaurant;

    const [rating, setRating] = useState(0);
    const [amount, setAmount] = useState('');
    const [dish, setDish] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (rating === 0) {
            Alert.alert('Ocena', 'Prosim izberi oceno (1-5 zvezdic).');
            return;
        }
        if (!dish.trim()) {
            Alert.alert('Manjka podatek', 'Vpiši kaj si jedel.');
            return;
        }

        setSaving(true);
        try {
            const uid = auth.currentUser?.uid;
            if (!uid) throw new Error('Nisi prijavljen.');

            const visit: Visit = {
                restaurantId: restaurant?.id ?? 'unknown',
                restaurantName: restaurant?.name ?? 'Neznana restavracija',
                address: restaurant?.address,
                cuisine: restaurant?.cuisine,
                personalRating: rating,
                amountSpent: parseFloat(amount) || 0,
                dishEaten: dish.trim(),
                visitedAt: date.toISOString(),
                notes: notes.trim() || undefined,
                createdAt: new Date().toISOString(),
            };

            await addDoc(collection(db, 'users', uid, 'visits'), visit);
            navigation.navigate('Home');
        } catch (e) {
            Alert.alert('Napaka', 'Shranjevanje ni uspelo. Poskusi znova.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (d: Date) =>
        d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Zabeleži obisk</Text>
            {restaurant && (
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
            )}

            {/* Zvezdice */}
            <Text style={styles.label}>Ocena</Text>
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                        <Text style={[styles.star, star <= rating && styles.starSelected]}>★</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Kaj si jedel */}
            <Text style={styles.label}>Kaj si jedel</Text>
            <TextInput
                style={styles.input}
                placeholder="npr. Margherita pizza, tiramisu..."
                value={dish}
                onChangeText={setDish}
            />

            {/* Koliko si porabil */}
            <Text style={styles.label}>Znesek (€)</Text>
            <TextInput
                style={styles.input}
                placeholder="npr. 18.50"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
            />

            {/* Datum obiska */}
            <Text style={styles.label}>Datum obiska</Text>
            <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
            >
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
                    {saving ? 'Shranjujem...' : '💾 Shrani obisk'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.skip}>Preskoči</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    restaurantName: {
        fontSize: 16,
        color: '#FF6B35',
        marginBottom: 28,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
        color: '#333',
    },
    optional: {
        fontWeight: '400',
        color: '#999',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    star: {
        fontSize: 40,
        color: '#ddd',
    },
    starSelected: {
        color: '#FF6B35',
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
    },
    inputMultiline: {
        height: 90,
        textAlignVertical: 'top',
    },
    dateButton: {
        borderWidth: 1.5,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 14,
    },
    dateText: {
        fontSize: 15,
        color: '#333',
    },
    button: {
        backgroundColor: '#FF6B35',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 32,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    skip: {
        textAlign: 'center',
        color: '#999',
        marginTop: 16,
        fontSize: 15,
    },
});
