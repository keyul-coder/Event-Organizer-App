import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    RefreshControl,
    SafeAreaView,
} from 'react-native';
import { collection, query, onSnapshot, doc, updateDoc, arrayRemove, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function FavoritesScreen({ navigation }) {
    const [favoriteEvents, setFavoriteEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadFavoriteEvents();
    }, []);

    const loadFavoriteEvents = async () => {
        try {
            // First, get user's favorite event IDs
            const userDoc = doc(db, 'users', auth.currentUser.uid);
            const unsubscribeUser = onSnapshot(userDoc, async (userSnapshot) => {
                if (userSnapshot.exists()) {
                    const favorites = userSnapshot.data().favorites || [];

                    if (favorites.length === 0) {
                        setFavoriteEvents([]);
                        setLoading(false);
                        setRefreshing(false);
                        return;
                    }

                    // Then get the actual events
                    const eventsQuery = query(collection(db, 'events'));
                    const unsubscribeEvents = onSnapshot(eventsQuery, (eventsSnapshot) => {
                        const allEvents = [];
                        eventsSnapshot.forEach((doc) => {
                            allEvents.push({ id: doc.id, ...doc.data() });
                        });

                        // Filter events that are in favorites
                        const favoriteEventsData = allEvents.filter(event =>
                            favorites.includes(event.id)
                        );

                        setFavoriteEvents(favoriteEventsData);
                        setLoading(false);
                        setRefreshing(false);
                    });

                    return unsubscribeEvents;
                } else {
                    setFavoriteEvents([]);
                    setLoading(false);
                    setRefreshing(false);
                }
            });

            return unsubscribeUser;
        } catch (error) {
            console.error('Error loading favorite events:', error);
            setLoading(false);
            setRefreshing(false);
        }
    };

    const removeFavorite = (eventId, eventTitle) => {
        Alert.alert(
            'Remove Favorite',
            `Remove "${eventTitle}" from your favorites?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const userRef = doc(db, 'users', auth.currentUser.uid);
                            await updateDoc(userRef, {
                                favorites: arrayRemove(eventId)
                            });
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadFavoriteEvents();
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderEventItem = ({ item }) => {
        return (
            <View style={styles.eventCard}>
                <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <TouchableOpacity
                        onPress={() => removeFavorite(item.id, item.title)}
                        style={styles.removeButton}
                    >
                        <Ionicons name="heart" size={24} color="#ef4444" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.eventDescription}>{item.description}</Text>

                <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                        <Text style={styles.eventDetailText}>{formatDate(item.date)}</Text>
                    </View>

                    <View style={styles.eventDetailRow}>
                        <Ionicons name="location-outline" size={16} color="#6b7280" />
                        <Text style={styles.eventDetailText}>{item.location}</Text>
                    </View>

                    <View style={styles.eventDetailRow}>
                        <Ionicons name="person-outline" size={16} color="#6b7280" />
                        <Text style={styles.eventDetailText}>By: {item.createdByName}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Favorite Events</Text>
                <Ionicons name="heart" size={24} color="#ef4444" />
            </View>

            <FlatList
                data={favoriteEvents}
                renderItem={renderEventItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="heart-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>No favorite events</Text>
                        <Text style={styles.emptySubtext}>
                            Add events to your favorites by tapping the heart icon
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    listContainer: {
        padding: 16,
    },
    eventCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        flex: 1,
        marginRight: 8,
    },
    removeButton: {
        padding: 4,
    },
    eventDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
        lineHeight: 20,
    },
    eventDetails: {
        marginBottom: 8,
    },
    eventDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    eventDetailText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 4,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
});