
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
    // Callback trả về trạng thái và vị trí (nếu có)
    onStatusChange?: (isEnabled: boolean, location?: LocationCoords) => void;
    initialStatus?: boolean;
}

const COLORS = {
    cardBg: '#FFFFFF',
    textDark: '#1A1A1A',
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

    const performGpsTask = async (): Promise<LocationCoords> => {
        return new Promise((resolve, reject) => {
            console.log("[Native] Starting GPS Foreground Service...");

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
            setIsLoading(true); // Hiện loading xoay xoay nếu cần
            try {

                const location = await performGpsTask();
                setIsEnabled(true);
                console.log("Check-in thành công tại:", location);

                if (onStatusChange) onStatusChange(true, location);

            } catch (error) {
                Alert.alert("Lỗi", (error as Error).message);
                // Không bật switch nếu lỗi
                setIsEnabled(false);
            } finally {
                setIsLoading(false);
            }
        }
        else {
            setIsEnabled(false);
            console.log("Đã tắt chế độ Check-in");
            if (onStatusChange) onStatusChange(false);
        }
    }, [isEnabled, onStatusChange]);

    return (
        <View style={styles.cardContainer}>
            {/* Label Text */}
            <Text style={styles.label}>
                {isLoading ? "Đang lấy vị trí..." : "Bắt đầu thực hiện công việc"}
            </Text>

            <View style={styles.controlsContainer}>
                {/* Switch */}
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

                {/* Location Icon with Border */}
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
        flexDirection: 'row', // Xếp ngang
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        // Shadow cho Android (Elevation)
        elevation: 4,
        // Shadow cho iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textDark,
        flex: 1, // Chiếm hết không gian bên trái
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // Khoảng cách giữa Switch và Icon (React Native 0.71+)
    },
    switch: {
        // Transform scale giúp switch nhỏ gọn hơn nếu muốn
        transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }]
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20, // Bo tròn thành hình tròn/oval
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0,
    },
    iconContainerActive: {
        borderColor: COLORS.primaryRed,
        backgroundColor: '#FFEBEE', // Nền đỏ rất nhạt
    },
    iconContainerInactive: {
        borderColor: '#CFD8DC',
        backgroundColor: '#F5F5F5',
    }
});

export default CheckInCard;