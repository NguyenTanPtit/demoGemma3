/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MainScreen from './UI/MainScreen';
import ChatScreen from './UI/ChatScreen';
import CameraWatermarkScreen from './UI/CameraWatermarkScreen.tsx';
import WOScreen from './UI/WOScreen';
import PreviewScreen from './UI/PreviewScreen';

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
