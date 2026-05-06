import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ActivityIndicator, View } from 'react-native';

import { auth } from './app/services/firebaseService';
import HomeScreen from './app/screens/HomeScreen';
import ResultScreen from './app/screens/ResultScreen';
import SavedScreen from './app/screens/SavedScreen';
import LoginScreen from './app/screens/LoginScreen';
import LogVisitScreen from './app/screens/LogVisitScreen';
import ProfileScreen from './app/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Firebase nas obvesti ko se stanje prijave spremeni
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return unsubscribe; // cleanup ko se App unmount-a
    }, []);

    // Dokler Firebase preverja stanje — pokaži spinner
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? (
                // Prijavljen → pokaži app
                <Stack.Navigator initialRouteName="Home">
                    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Rezultat' }} />
                    <Stack.Screen name="Saved" component={SavedScreen} options={{ title: 'Shranjene' }} />
                    <Stack.Screen name="LogVisit" component={LogVisitScreen} options={{ title: 'Zabeleži obisk' }} />
                    <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
                </Stack.Navigator>
            ) : (
                // Ni prijavljen → pokaži login
                <Stack.Navigator>
                    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                </Stack.Navigator>
            )}
        </NavigationContainer>
    );
}
