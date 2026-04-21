import { Animated, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useNavigation } from '@react-navigation/native';
import { pickRandom, calculateDistance } from '../services/overpassService';
import { useState, useRef, useEffect } from 'react';

export default function ResultScreen() {
    const navigation = useNavigation<any>();
    const { selected, restaurants, setSelected, saveRestaurant, userLocation } = useAppStore();
    const [isSaved, setIsSaved] = useState(false);

    // Fade in + slide up animacija
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(60)).current;

    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(60);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, [selected]);

    if (!selected) {
        return (
            <View style={styles.container}>
                <Text>Ni izbrane restavracije.</Text>
            </View>
        );
    }

    const distance = userLocation
        ? calculateDistance(userLocation.lat, userLocation.lon, selected.lat, selected.lon)
        : null;

    const distanceText = distance
        ? distance < 1000
            ? `${Math.round(distance)}m od tebe`
            : `${(distance / 1000).toFixed(1)}km od tebe`
        : null;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.name}>{selected.name}</Text>

            {selected.cuisine && (
                <Text style={styles.cuisine}>{selected.cuisine.join(', ')}</Text>
            )}
            {selected.address && (
                <Text style={styles.address}>📍 {selected.address}</Text>
            )}
            {selected.openingHours && (
                <Text style={styles.hours}>🕐 {selected.openingHours}</Text>
            )}
            {distanceText && (
                <Text style={styles.distance}>🚶 {distanceText}</Text>
            )}

            <TouchableOpacity
                style={styles.button}
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${selected.lat},${selected.lon}`)}
            >
                <Text style={styles.buttonText}>🗺️ Navigiraj</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.buttonOutline}
                onPress={() => {
                    setSelected(pickRandom(restaurants));
                    setIsSaved(false);
                }}
            >
                <Text style={styles.buttonTextOutline}>🎲 Daj mi drugo</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={isSaved ? styles.buttonSaved : styles.buttonOutline}
                onPress={() => {
                    saveRestaurant({ ...selected, savedAt: new Date().toISOString() });
                    setIsSaved(true);
                }}
            >
                <Text style={isSaved ? styles.buttonTextSaved : styles.buttonTextOutline}>
                    {isSaved ? '✅ Shranjeno!' : '💾 Shrani'}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cuisine: {
        fontSize: 16,
        color: '#FF6B35',
        marginTop: 8,
    },
    address: {
        fontSize: 15,
        color: '#555',
        marginTop: 12,
    },
    hours: {
        fontSize: 15,
        color: '#555',
        marginTop: 8,
    },
    distance: {
        fontSize: 15,
        color: '#555',
        marginTop: 8,
    },
    button: {
        backgroundColor: '#FF6B35',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 32,
    },
    buttonOutline: {
        borderWidth: 2,
        borderColor: '#FF6B35',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonTextOutline: {
        color: '#FF6B35',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonSaved: {
        borderWidth: 2,
        borderColor: 'green',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    buttonTextSaved: {
        color: 'green',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
