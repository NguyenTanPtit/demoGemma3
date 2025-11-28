import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Platform,
    PermissionsAndroid,
    Alert,
    ActivityIndicator,
    AppState,
    AppStateStatus
} from 'react-native';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
} from 'react-native-vision-camera';
import Geolocation from 'react-native-geolocation-service';
import { useIsFocused } from '@react-navigation/native';

const CameraScreen = () => {
    // 1. Camera Setup
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();

    // Lifecycle management for Camera to avoid crash on navigation
    const isFocused = useIsFocused();
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
    const [isCameraActive, setIsCameraActive] = useState(false);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            setAppState(nextAppState);
        });
        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        // Only activate camera when focused and app is active
        // Adding a small delay to ensure transition is complete
        let timeout: NodeJS.Timeout;

        if (isFocused && appState === 'active') {
            timeout = setTimeout(() => {
                setIsCameraActive(true);
            }, 500); // 500ms delay to allow screen transition to finish
        } else {
            setIsCameraActive(false);
        }

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [isFocused, appState]);


    // 2. State for Overlay
    const [currentDate, setCurrentDate] = useState(new Date());
    const [location, setLocation] = useState<{ lat: number; long: number }>({ lat: 0.0, long: 0.0 });

    // 3. Request Permissions (Camera & Location)
    useEffect(() => {
        const checkPermissions = async () => {
            // Camera Permission (Vision Camera handles this nicely)
            if (!hasPermission) {
                await requestPermission();
            }

            // Location Permission (Android specific manual check)
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert("Permission Denied", "Location permission is needed.");
                }
            }
        };

        checkPermissions();
    }, [hasPermission, requestPermission]);

    // 4. Live Clock Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 5. Live Location Logic
    useEffect(() => {
        // Watch position for updates
        const watchId = Geolocation.watchPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude ?? 0.0,
                    long: position.coords.longitude ?? 0.0,
                });
            },
            (error) => {
                console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 }
        );

        return () => Geolocation.clearWatch(watchId);
    }, []);

    // Handling "No Device" state
    if (device == null) return <ActivityIndicator size="large" color="red" />;

    return (
        <View style={styles.container}>
            {/* The Camera View */}
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isCameraActive}
                photo={true}
            />

            {/* The Overlay: Bottom Left Corner */}
            <View style={styles.overlay}>
                <Text style={styles.text}>
                    Time: {currentDate.toLocaleTimeString()}
                </Text>
                <Text style={styles.text}>
                    Lat: {location.lat?.toFixed(5) || 'Loading...'}
                </Text>
                <Text style={styles.text}>
                    Long: {location.long?.toFixed(5) || 'Loading...'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    overlay: {
        position: 'absolute',
        bottom: 20, // Bottom corner
        left: 20,   // Left corner
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent background
        padding: 10,
        borderRadius: 8,
    },
    text: {
        color: 'green',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier', // Monospace looks better for data
    },
});

export default CameraScreen;
