/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { SafeAreaView, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import ChatScreen from './UI/ChatScreen';
import CameraWatermarkScreen from "./UI/CameraWatermarkScreen.tsx";

const App = (): React.JSX.Element => {
    const isDarkMode = useColorScheme() === 'dark';

    const backgroundStyle = {
        backgroundColor: isDarkMode ? '#000' : '#fff',
        flex: 1,
    };

    return (
        <SafeAreaView style={backgroundStyle}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={backgroundStyle.backgroundColor}
            />

            <View style={styles.container}>
                <CameraWatermarkScreen />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});

export default App;