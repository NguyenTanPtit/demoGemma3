import {Pressable, StyleProp, StyleSheet, Text, View, ViewStyle} from "react-native";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import React from "react";


interface IconButtonProps {
    onPress: () => void;
    iconName: string;
    color?: string;
    size?: number;
    style?: StyleProp<ViewStyle>;
}

const IconButton = ({ onPress, iconName, color = '#000000', size = 24, style }:IconButtonProps) => {
    return (
        <View style={[styles.container, style]}>
            <Pressable
                onPress={onPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true, radius: 24 }}
                style={({ pressed }) => [
                    styles.button,
                    pressed && styles.pressed
                ]}
            >
                <MaterialIcons name={iconName} size={size} color={color} />
            </Pressable>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    button: {
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.7,
    },

    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        backgroundColor: '#FFFFFF',
        elevation: 2,
    },

    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        marginRight: 40,
        marginLeft: 20,
    }
});

const Header = () => {
    return (
        <View style={styles.headerContainer}>
            <IconButton
                onPress={() => {
                    console.log('Icon button pressed');
                }}
                iconName="back-arrow"
                color="#000000"
                style={{marginLeft: 10}}
            />
            <Text style={styles.headerTitle}>Chi tiết công việc</Text>
        </View>
    );
}

export default Header;


