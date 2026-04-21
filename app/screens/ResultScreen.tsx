import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useNavigation } from '@react-navigation/native';

export default function ResultScreen() {
    const { selected } = useAppStore();
    const navigation = useNavigation<any>();

    if (!selected) {
        return (
            <View style={styles.container}>
                <Text>Ni izbrane restavracije.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
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

            <TouchableOpacity
                style={styles.button}
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${selected.lat},${selected.lon}`)}
            >
                <Text style={styles.buttonText}>🗺️ Navigiraj</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.buttonOutline}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.buttonTextOutline}>🎰 Zavrti znova</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.buttonOutline}
                onPress={() => console.log('shrani')}
            >
                <Text style={styles.buttonTextOutline}>💾 Shrani</Text>
            </TouchableOpacity>
        </View>
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
});
