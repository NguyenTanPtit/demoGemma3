import React from 'react';
import {AppRegistry, StatusBar, useColorScheme} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MainScreen from './src/UI/MainScreen';
import ChatScreen from './src/UI/ChatScreen';
import CameraWatermarkScreen from './src/UI/CameraWatermarkScreen.tsx';
import WOScreen from './src/UI/WOScreen';
import PreviewScreen from './src/UI/PreviewScreen';
import { startNetworkLogging } from 'react-native-network-logger';

startNetworkLogging();
AppRegistry.registerComponent('App', () => App);


const Stack = createNativeStackNavigator();

const App = (): React.JSX.Element => {
    const isDarkMode = useColorScheme() === 'dark';

    const backgroundStyle = {
        backgroundColor: isDarkMode ? '#000' : '#fff',
    };

    return (
        <SafeAreaProvider>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={backgroundStyle.backgroundColor}
            />
            <NavigationContainer>
                <Stack.Navigator initialRouteName="Main">
                    <Stack.Screen
                        name="Main"
                        component={MainScreen}
                        options={{ title: 'Home', headerShown: false }}
                    />
                    <Stack.Screen
                        name="CameraScreen"
                        component={CameraWatermarkScreen}
                        options={{ title: 'Camera', headerShown: false }}
                    />
                    <Stack.Screen
                        name="ChatScreen"
                        component={ChatScreen}
                        options={{ title: 'AI Chat', headerShown: false }}
                    />
                    <Stack.Screen
                        name="WOScreen"
                        component={WOScreen}
                        options={{ title: 'Work Order', headerShown: false }}
                    />
                     <Stack.Screen
                        name="PreviewScreen"
                        component={PreviewScreen}
                        options={{ title: 'Preview', headerShown: false }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
