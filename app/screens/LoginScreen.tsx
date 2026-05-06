import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseService';
import { COLORS, FONTS } from '../constants/theme';

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
                const credential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', credential.user.uid), {
                    email: credential.user.email,
                    createdAt: new Date().toISOString(),
                    totalVisits: 0,
                    totalSpent: 0,
                });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (e: any) {
            const msg: Record<string, string> = {
                'auth/invalid-email': 'Neveljaven email naslov.',
                'auth/user-not-found': 'Uporabnik ne obstaja.',
                'auth/wrong-password': 'Napačno geslo.',
                'auth/email-already-in-use': 'Email je že v uporabi.',
                'auth/weak-password': 'Geslo mora imeti vsaj 6 znakov.',
                'auth/invalid-credential': 'Napačen email ali geslo.',
            };
            setError(msg[e.code] ?? 'Prišlo je do napake.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <Text style={styles.emoji}>🎰</Text>
                <Text style={styles.title}>biteRoulette</Text>
                <Text style={styles.subtitle}>Odkrivaj restavracije v svoji okolici</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.formTitle}>{isRegister ? 'Ustvari račun' : 'Dobrodošel nazaj'}</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={COLORS.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Geslo"
                    placeholderTextColor={COLORS.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

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
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    emoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    title: {
        ...FONTS.largeTitle,
        letterSpacing: -0.5,
    },
    subtitle: {
        ...FONTS.callout,
        marginTop: 6,
        textAlign: 'center',
    },
    form: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    formTitle: {
        ...FONTS.title3,
        marginBottom: 20,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    errorBox: {
        backgroundColor: '#FFF1F0',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 14,
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    toggle: {
        textAlign: 'center',
        color: COLORS.primary,
        marginTop: 16,
        fontSize: 15,
    },
});
