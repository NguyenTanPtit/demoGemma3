import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    useMicrophonePermission,
} from 'react-native-vision-camera';
import Geolocation from 'react-native-geolocation-service';
import { useIsFocused, useNavigation, useFocusEffect } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import ImageResizer from 'react-native-image-resizer';
import Slider from '@react-native-community/slider';

type CaptureMode = 'photo' | 'video';

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const CameraScreen = () => {
    const navigation = useNavigation<any>();

    // 1. Camera Setup
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();

    const cameraRef = useRef<Camera>(null);
    const viewShotRef = useRef<ViewShot>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    // Lifecycle management for Camera to avoid crash on navigation
    const isFocused = useIsFocused();
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
    const [isCameraActive, setIsCameraActive] = useState(false);

    // Temp photo path for watermark capture workaround
    const [tempPhotoPath, setTempPhotoPath] = useState<string | null>(null);

    // New State for Video & Zoom
    const [zoom, setZoom] = useState(device?.neutralZoom || 1);
    const [mode, setMode] = useState<CaptureMode>('photo');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);

    // Reset capturing state when screen gains focus
    useFocusEffect(
        useCallback(() => {
            setIsCapturing(false);
            setTempPhotoPath(null);
            setIsRecording(false);
            setRecordingDuration(0);

            // Re-activate camera logic handled by isFocused effect
            return () => {
                 // cleanup if needed
            };
        }, [])
    );

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            setRecordingDuration(0);
            interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

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

    // 3. Request Permissions (Camera, Mic & Location)
    useEffect(() => {
        const checkPermissions = async () => {
            // Camera Permission
            if (!hasPermission) {
                await requestPermission();
            }

            // Microphone Permission
            if (!hasMicPermission) {
                await requestMicPermission();
            }

            // Location Permission
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
    }, [hasPermission, requestPermission, hasMicPermission, requestMicPermission]);

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
             // 2. Capture the View (Image + Overlay)
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
            navigation.navigate('PreviewScreen', { uri: compressedResult.uri, type: 'photo' });

        } catch (error) {
            console.error("Capture processing failed:", error);
            Alert.alert("Error", "Failed to process image.");
            setIsCapturing(false);
            setTempPhotoPath(null);
        }
    };

    const handlePhotoCapture = async () => {
        if (isCapturing || !cameraRef.current) return;

        try {
            setIsCapturing(true);

            // 1. Take the high-res photo first
            const photo = await cameraRef.current.takePhoto({
                // flash: 'off' // Removed to allow auto exposure/flash
            });

            // Set the temp photo path to display it
            const photoUri = Platform.OS === 'android' ? `file://${photo.path}` : photo.path;
            setTempPhotoPath(photoUri);

        } catch (error) {
            console.error("Capture failed:", error);
            Alert.alert("Error", "Failed to capture image.");
            setIsCapturing(false);
        }
    };

    const handleVideoCapture = async () => {
        if (!cameraRef.current) return;

        if (isRecording) {
            // STOP Recording
            try {
                await cameraRef.current.stopRecording();
                setIsRecording(false);
            } catch (err) {
                console.error("Stop recording error", err);
            }
        } else {
            // START Recording
            try {
                if (!hasMicPermission) {
                    Alert.alert("Permission Error", "Microphone permission is required for video.");
                    return;
                }
                setIsRecording(true);
                cameraRef.current.startRecording({
                    onRecordingFinished: (video) => {
                        console.log("Video finished", video);
                        setIsRecording(false);
                         navigation.navigate('PreviewScreen', { uri: video.path, type: 'video' });
                    },
                    onRecordingError: (error) => {
                        console.error("Video error", error);
                        setIsRecording(false);
                        Alert.alert("Error", "Recording failed.");
                    }
                });
            } catch (err) {
                console.error("Start recording error", err);
                setIsRecording(false);
            }
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
                options={{ format: "png", quality: 1.0, result: "tmpfile" }}
            >
                {tempPhotoPath ? (
                    <Image
                        source={{ uri: tempPhotoPath }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                        fadeDuration={0}
                        onLoad={processCapturedImage} // Trigger capture of the view once image is loaded
                    />
                ) : (
                    <Camera
                        ref={cameraRef}
                        style={StyleSheet.absoluteFill}
                        device={device}
                        isActive={isCameraActive}
                        photo={true}
                        video={true} // Enable video
                        audio={hasMicPermission} // Enable audio only if we have permission
                        zoom={zoom}
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

            {/* Recording Timer */}
            {isRecording && (
                <View style={styles.timerContainer}>
                     <View style={styles.redDot} />
                     <Text style={styles.timerText}>{formatDuration(recordingDuration)}</Text>
                </View>
            )}

            {/* Mode Switcher */}
             {!isCapturing && !isRecording && !tempPhotoPath && (
                <View style={styles.modeSwitcher}>
                    <Pressable onPress={() => setMode('photo')}>
                        <Text style={[styles.modeText, mode === 'photo' && styles.activeModeText]}>Photo</Text>
                    </Pressable>
                    <Pressable onPress={() => setMode('video')}>
                        <Text style={[styles.modeText, mode === 'video' && styles.activeModeText]}>Video</Text>
                    </Pressable>
                </View>
            )}

            {/* Zoom Slider */}
             {!isCapturing && !tempPhotoPath && (
                 <View style={styles.sliderContainer}>
                     <Text style={styles.zoomText}>{(zoom || 1).toFixed(1)}x</Text>
                     <Slider
                        style={{width: 200, height: 40}}
                        minimumValue={device.minZoom}
                        maximumValue={Math.min(device.maxZoom, 10)} // Cap at 10x
                        minimumTrackTintColor="#FFFFFF"
                        maximumTrackTintColor="#000000"
                        value={zoom}
                        onValueChange={setZoom}
                     />
                 </View>
             )}


            {/* Capture Button - Hide when processing to avoid double clicks */}
            {!isCapturing && (
                <View style={styles.bottomBar}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.captureButton,
                            mode === 'video' && styles.videoButton,
                            isRecording && styles.recordingButton,
                            pressed && styles.captureButtonPressed
                        ]}
                        onPress={mode === 'photo' ? handlePhotoCapture : handleVideoCapture}
                    >
                         <View style={[
                            styles.captureInner,
                            mode === 'video' && styles.videoInner,
                            isRecording && styles.recordingInner
                         ]} />
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
    videoButton: {
        borderColor: 'red',
    },
    recordingButton: {
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
    videoInner: {
        backgroundColor: 'red',
    },
    recordingInner: {
        width: 40,
        height: 40,
        borderRadius: 5, // Square when recording
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
    },
    modeSwitcher: {
        position: 'absolute',
        bottom: 150,
        flexDirection: 'row',
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 5,
    },
    modeText: {
        color: '#ccc',
        paddingHorizontal: 15,
        paddingVertical: 5,
        fontWeight: 'bold',
    },
    activeModeText: {
        color: '#fff',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 15,
        overflow: 'hidden',
    },
    sliderContainer: {
        position: 'absolute',
        bottom: 200,
        alignSelf: 'center',
        alignItems: 'center',
        width: '100%',
    },
    zoomText: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    timerContainer: {
        position: 'absolute',
        top: 50,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    redDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'red',
        marginRight: 8,
    },
    timerText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    }
});

export default CameraScreen;
