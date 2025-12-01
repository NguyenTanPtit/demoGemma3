import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    Switch,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';

interface LocationCoords {
    latitude: number;
    longitude: number;
}

interface CheckInCardProps {
    onStatusChange?: (isEnabled: boolean, location?: LocationCoords) => void;
    initialStatus?: boolean;
}

const COLORS = {
    cardBg: '#FFFFFF',
    textDark: '#1A1A1A',
    textGray: '#757575',
    primaryRed: '#D32F2F',
    borderGray: '#E0E0E0',
    switchTrackActive: '#EF9A9A',
    switchThumbActive: '#D32F2F',
    switchTrackInactive: '#B0BEC5',
    switchThumbInactive: '#ECEFF1',
};

const CheckInCard = ({ onStatusChange, initialStatus = false }: CheckInCardProps) => {
    const [isEnabled, setIsEnabled] = useState(initialStatus);
    const [isLoading, setIsLoading] = useState(false);
    // State để lưu thông tin hiển thị
    const [checkInInfo, setCheckInInfo] = useState<string | null>(null);

    const performGpsTask = async (): Promise<LocationCoords> => {
        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => reject(new Error("Không thể lấy vị trí GPS. Vui lòng bật Location.")),
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
            );
        });
    };

    const toggleSwitch = useCallback(async () => {
        if (!isEnabled) {
            setIsLoading(true);
            try {
                const location = await performGpsTask();

                // Lấy thời gian hiện tại
                const now = new Date();
                const timeString = `${now.getHours()}:${now.getMinutes()} ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

                // Format thông tin hiển thị
                const infoText = `Lat: ${location.latitude.toFixed(5)}\nLong: ${location.longitude.toFixed(5)}\nTime: ${timeString}`;

                setIsEnabled(true);
                setCheckInInfo(infoText);

                if (onStatusChange) onStatusChange(true, location);

            } catch (error) {
                Alert.alert("Lỗi", (error as Error).message);
                setIsEnabled(false);
                setCheckInInfo(null);
            } finally {
                setIsLoading(false);
            }
        }
        else {
            setIsEnabled(false);
            setCheckInInfo(null);
            if (onStatusChange) onStatusChange(false);
        }
    }, [isEnabled, onStatusChange]);

    return (
        <View style={styles.cardContainer}>
            <View style={styles.textContainer}>
                <Text style={styles.label}>
                    {isLoading ? "Đang lấy vị trí..." : "Bắt đầu thực hiện công việc"}
                </Text>
                {/* Hiển thị thông tin Lat/Long/Time khi check-in thành công */}
                {isEnabled && checkInInfo && (
                    <Text style={styles.infoText}>{checkInInfo}</Text>
                )}
            </View>

            <View style={styles.controlsContainer}>
                {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primaryRed} style={{marginRight: 10}}/>
                ) : (
                    <Switch
                        trackColor={{ false: COLORS.switchTrackInactive, true: COLORS.switchTrackActive }}
                        thumbColor={isEnabled ? COLORS.switchThumbActive : COLORS.switchThumbInactive}
                        onValueChange={toggleSwitch}
                        value={isEnabled}
                        style={styles.switch}
                    />
                )}

                <View style={[
                    styles.iconContainer,
                    isEnabled ? styles.iconContainerActive : styles.iconContainerInactive
                ]}>
                    <MaterialCommunityIcons
                        name="map-marker-radius"
                        size={24}
                        color={isEnabled ? COLORS.primaryRed : '#90A4AE'}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: COLORS.cardBg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    textContainer: {
        flex: 1,
        paddingRight: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textDark,
    },
    infoText: {
        marginTop: 4,
        fontSize: 12,
        color: COLORS.textGray,
        lineHeight: 16,
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    switch: {
        transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }]
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0,
    },
    iconContainerActive: {
        borderColor: COLORS.primaryRed,
        backgroundColor: '#FFEBEE',
    },
    iconContainerInactive: {
        borderColor: '#CFD8DC',
        backgroundColor: '#F5F5F5',
    }
});

export default CheckInCard;