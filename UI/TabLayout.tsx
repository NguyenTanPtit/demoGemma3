import React, {useState} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';

const CustomTabs = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Danh sách các tab
    const tabs = ["Tổng quan", "Khác", "Cần xử lý", "Ghi chú"];

    return (
        <View style={styles.container}>
            {tabs.map((tab, index) => {
                const isSelected = selectedIndex === index;

                return (
                    <Pressable
                        key={index}
                        onPress={() => setSelectedIndex(index)}
                        style={({pressed}) => [
                            styles.tabItem,
                            // Tương đương logic của drawable selector trong Android
                            isSelected ? styles.tabItemSelected : null,
                            pressed ? {opacity: 0.7} : null
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                {color: isSelected ? '#000000' : '#808080'}
                            ]}
                        >
                            {tab}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        justifyContent: 'space-between',
    },
    tabItem: {
        paddingHorizontal: 12,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
    },
    tabItemSelected: {
        backgroundColor: '#E0E0E0',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
    }
});

export default CustomTabs;