import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useAppStore } from '../store/useAppStore';

export default function SavedScreen() {
    const { saved } = useAppStore();

    return (
    <View style={styles.container}>
        <Text style={styles.title}>💾 Shranjene</Text>

        <FlatList
            data={saved}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.cuisine && (
                        <Text style={styles.cuisine}>{item.cuisine.join(', ')}</Text>
                    )}
                </View>
            )}
            ListEmptyComponent={
                <Text style={styles.empty}>Še nisi shranil nobene restavracije.</Text>
            }
        />
    </View>
);
}
const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, paddingTop: 60 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    card: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    name: { fontSize: 18, fontWeight: '600' },
    cuisine: { fontSize: 14, color: '#FF6B35', marginTop: 4 },
    empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});