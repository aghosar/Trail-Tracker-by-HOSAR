
import React from 'react';
import { StyleSheet, View, ViewStyle, Text } from 'react-native';

// NOTE: react-leaflet and leaflet dependencies were removed from package.json
// This is a placeholder implementation for web. To enable web maps, install:
// npm install react-leaflet leaflet @types/leaflet

export interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
}

interface MapProps {
    markers?: MapMarker[];
    initialRegion?: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
    style?: ViewStyle;
    showsUserLocation?: boolean;
}

export const Map = ({
    markers = [],
    initialRegion = {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    },
    style,
    showsUserLocation = false
}: MapProps) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                    Map view (Web)
                </Text>
                <Text style={styles.placeholderSubtext}>
                    Location: {initialRegion.latitude.toFixed(4)}, {initialRegion.longitude.toFixed(4)}
                </Text>
                {markers.length > 0 && (
                    <Text style={styles.placeholderSubtext}>
                        {markers.length} marker{markers.length !== 1 ? 's' : ''}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: 12,
        width: '100%',
        minHeight: 200,
        backgroundColor: '#e8f4f8',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    placeholderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    placeholderSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
});
