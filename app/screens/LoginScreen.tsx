import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseService';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setError(null);
        setLoading(true);

        try {
            if (isRegister) {
                // Registracija — ustvari račun + Firestore profil
                const credential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', credential.user.uid), {
                    email: credential.user.email,
                    createdAt: new Date().toISOString(),
                    totalVisits: 0,
                    totalSpent: 0,
                });
            } else {
                // Prijava
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (e: any) {
            // Firebase vrne angleške napake — prevedemo najpogostejše
            const msg: Record<string, string> = {
                'auth/invalid-email': 'Neveljaven email naslov.',
                'auth/user-not-found': 'Uporabnik ne obstaja.',
                'auth/wrong-password': 'Napačno geslo.',
                'auth/email-already-in-use': 'Email je že v uporabi.',
                'auth/weak-password': 'Geslo mora imeti vsaj 6 znakov.',
                'auth/invalid-credential': 'Napačen email ali geslo.',
            };
            setError(msg[e.code] ?? 'Prišlo je do napake. Poskusi znova.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Text style={styles.title}>🎰 biteRoulette</Text>
            <Text style={styles.subtitle}>{isRegister ? 'Ustvari račun' : 'Prijava'}</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Geslo"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                {loading
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.buttonText}>{isRegister ? 'Registracija' : 'Prijava'}</Text>
                }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setIsRegister(!isRegister); setError(null); }}>
                <Text style={styles.toggle}>
                    {isRegister ? 'Že imaš račun? Prijavi se.' : 'Nimaš računa? Registriraj se.'}
                </Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 32,
        backgroundColor: 'white',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 20,
        textAlign: 'center',
        color: '#555',
        marginBottom: 32,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#FF6B35',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    toggle: {
        textAlign: 'center',
        color: '#FF6B35',
        marginTop: 20,
        fontSize: 15,
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 12,
        fontSize: 14,
    },
});
