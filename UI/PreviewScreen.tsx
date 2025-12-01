import React, { useState } from 'react';
import { View, Image, StyleSheet, Pressable, Text, Alert, Platform, ActivityIndicator, PermissionsAndroid } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Video from 'react-native-video';

const PreviewScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { uri, imageUri, type = 'photo' } = route.params || {}; // Support both keys for backward compat
    const fileUri = uri || imageUri;
    const [saving, setSaving] = useState(false);

    const hasAndroidPermission = async () => {
        // For Android 13+ (SDK 33+), permissions are handled differently (READ_MEDIA_IMAGES / VIDEO)
        // CameraRoll usually handles saving without explicit WRITE permission on modern Android if using Scoped Storage,
        // but for broader compatibility checking is good.
        // However, on Android 10+ (API 29+), writing to the public gallery (via MediaStore) typically doesn't need WRITE_EXTERNAL_STORAGE permission
        // if we are just adding new files.
        // Let's stick to the basic check for older Android versions where it is mandatory.

        if (Platform.OS !== 'android') return true;

        const version = Platform.Version;
        if (typeof version === 'number' && version >= 33) {
            return true; // Android 13+ doesn't need WRITE_EXTERNAL_STORAGE for saving
        }

        const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
        const hasPermission = await PermissionsAndroid.check(permission);
        if (hasPermission) return true;

        const status = await PermissionsAndroid.request(permission);
        return status === PermissionsAndroid.RESULTS.GRANTED;
    };

    const handleSave = async () => {
        if (!fileUri) return;

        try {
            setSaving(true);

            if (Platform.OS === 'android' && !(await hasAndroidPermission())) {
                 Alert.alert("Permission Denied", "Cannot save without storage permission.");
                 return;
            }

            const assetType = type === 'video' ? 'video' : 'photo';
            await CameraRoll.saveAsset(fileUri, { type: assetType });

            Alert.alert("Success", `${type === 'video' ? 'Video' : 'Image'} saved to gallery!`, [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error("Save error:", error);
            Alert.alert("Error", `Failed to save ${type}.`);
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        navigation.goBack();
    };

    if (!fileUri) {
        return (
            <View style={styles.container}>
                <Text style={{color: 'white'}}>No media to preview.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
             {type === 'video' ? (
                 <Video
                    source={{ uri: fileUri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                    controls={true}
                    repeat={true}
                 />
             ) : (
                <Image source={{ uri: fileUri }} style={styles.previewImage} resizeMode="contain" />
             )}

            <View style={styles.controls}>
                <Pressable style={[styles.button, styles.discardButton]} onPress={handleDiscard}>
                    <MaterialCommunityIcons name="close" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Discard</Text>
                </Pressable>

                <Pressable
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="content-save" size={24} color="#fff" />
                            <Text style={styles.buttonText}>Save</Text>
                        </>
                    )}
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    previewImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        position: 'absolute',
        bottom: 0,
        width: '100%',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        minWidth: 120,
        justifyContent: 'center',
    },
    discardButton: {
        backgroundColor: '#d32f2f',
    },
    saveButton: {
        backgroundColor: '#2e7d32',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
});

export default PreviewScreen;
