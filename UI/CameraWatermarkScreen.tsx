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
    AppStateStatus,
    Pressable,
    Image
} from 'react-native';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
} from 'react-native-vision-camera';
import Geolocation from 'react-native-geolocation-service';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import ImageResizer from 'react-native-image-resizer';

const CameraScreen = () => {
    const navigation = useNavigation<any>();

    // 1. Camera Setup
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const cameraRef = useRef<Camera>(null);
    const viewShotRef = useRef<ViewShot>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    // Lifecycle management for Camera to avoid crash on navigation
    const isFocused = useIsFocused();
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
    const [isCameraActive, setIsCameraActive] = useState(false);

    // Temp photo path for watermark capture workaround
    const [tempPhotoPath, setTempPhotoPath] = useState<string | null>(null);

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

    const processCapturedImage = async () => {
        if (!viewShotRef.current) return;

        try {
             // 2. Capture the View (Image + Overlay) - Now it is capturing a static Image view, so it works!
            const uri = await viewShotRef.current.capture();
            if (!uri) throw new Error("Failed to capture view");

            // 3. Compress the image (70% quality)
            const compressedResult = await ImageResizer.createResizedImage(
                uri,
                1080,
                1920,
                'JPEG',
                70,
                0,
                undefined,
                false,
                { mode: 'contain' }
            );

            // 4. Navigate to Preview
            navigation.navigate('PreviewScreen', { imageUri: compressedResult.uri });

            // Clean up temp photo path after navigation
            setTempPhotoPath(null);
        } catch (error) {
            console.error("Capture processing failed:", error);
            Alert.alert("Error", "Failed to process image.");
            setIsCapturing(false);
            setTempPhotoPath(null);
        }
    };

    const handleCapture = async () => {
        if (isCapturing || !cameraRef.current) return;

        try {
            setIsCapturing(true);

            // 1. Take the high-res photo first
            const photo = await cameraRef.current.takePhoto({
                flash: 'off'
            });

            // Set the temp photo path to display it
            // On Android, we need to ensure the path is usable by Image component (file://)
            const photoUri = Platform.OS === 'android' ? `file://${photo.path}` : photo.path;
            setTempPhotoPath(photoUri);

            // The rest of the logic happens in the Image onLoad (processCapturedImage) or after a small timeout if onLoad is flaky
            // But relying on onLoad is safer.

        } catch (error) {
            console.error("Capture failed:", error);
            Alert.alert("Error", "Failed to capture image.");
            setIsCapturing(false);
        }
    };

    // Handling "No Device" state
    if (device == null) return <ActivityIndicator size="large" color="red" />;

    return (
        <View style={styles.container}>
            {/* ViewShot wraps the content. If tempPhotoPath exists, it shows the Image, otherwise the Camera */}
            <ViewShot
                ref={viewShotRef}
                style={styles.viewShotContainer}
                options={{ format: "jpg", quality: 0.9, result: "tmpfile" }}
            >
                {tempPhotoPath ? (
                    <Image
                        source={{ uri: tempPhotoPath }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                        onLoad={processCapturedImage} // Trigger capture of the view once image is loaded
                    />
                ) : (
                    <Camera
                        ref={cameraRef}
                        style={StyleSheet.absoluteFill}
                        device={device}
                        isActive={isCameraActive}
                        photo={true}
                    />
                )}

                {/* The Overlay: Bottom Left Corner - Always visible on top */}
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
            </ViewShot>

            {/* Capture Button - Hide when processing to avoid double clicks */}
            {!isCapturing && (
                <View style={styles.bottomBar}>
                    <Pressable
                        style={({ pressed }) => [styles.captureButton, pressed && styles.captureButtonPressed]}
                        onPress={handleCapture}
                    >
                        <View style={styles.captureInner} />
                    </Pressable>
                </View>
            )}

             {isCapturing && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Processing...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    viewShotContainer: {
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
    bottomBar: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'white',
    },
    captureButtonPressed: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        transform: [{ scale: 0.95 }],
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    loadingText: {
        color: 'white',
        marginTop: 10,
        fontSize: 16,
    }
});

export default CameraScreen;
