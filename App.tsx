/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MainScreen from './UI/MainScreen';
import ChatScreen from './UI/ChatScreen';
import CameraWatermarkScreen from './UI/CameraWatermarkScreen.tsx';
import WOScreen from './UI/WOScreen';

const Stack = createNativeStackNavigator();

const App = (): React.JSX.Element => {
    return (
        <SafeAreaProvider>
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
                        options={{ title: 'Camera', headerShown: true }}
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
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
