import {Pressable, StyleProp, StyleSheet, Text, View, ViewStyle} from "react-native";
import {memo} from "react";
import React from "react";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export interface StepData {
    id: string | number;
    label: string;
    iconName: string;
}

const COLORS = {
    activeFill: '#00BCD4',
    completedFill: '#2ECC71',
    pendingFill: '#546E7A',
    line: '#B0BEC5',
    textDark: '#263238',
    textGray: '#90A4AE',
    white: '#FFFFFF',
    redBorder: '#FF0000',
};

interface StepProgressProps {
    steps: StepData[];
    currentStepIndex: number;
    containerStyle?: StyleProp<ViewStyle>;
    onStepPress?: (item: StepData, index: number) => void;
}

const StepProgress = memo(({steps, currentStepIndex, containerStyle, onStepPress}: StepProgressProps) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isActive = index === currentStepIndex;
                const isLastItem = index === steps.length - 1;

                let bgColor = COLORS.pendingFill;
                let textColor = COLORS.textGray;
                let borderColor = 'transparent';

                if (isCompleted) {
                    bgColor = COLORS.completedFill;
                    textColor = COLORS.textDark;
                    borderColor = COLORS.redBorder;
                } else if (isActive) {
                    bgColor = COLORS.activeFill;
                    textColor = COLORS.textDark;
                    borderColor = COLORS.redBorder;
                }
                return (
                    <React.Fragment key={step.id}>
                        <Pressable
                            onPress={() => {
                                if (onStepPress) {
                                    onStepPress(step, index);
                                }
                            }}
                            hitSlop={10}
                            style={({pressed}) => [
                                styles.stepItemContainer,
                                pressed && {opacity: 0.7}
                            ]}
                        >

                            <View style={[styles.outerCircle, {borderColor}]}>

                                <View style={[styles.innerCircle, {backgroundColor: bgColor}]}>
                                    <MaterialCommunityIcons
                                        name={step.iconName}
                                        size={20}
                                        color={COLORS.white}
                                    />
                                </View>
                            </View>

                            <Text style={[styles.label, {color: textColor}]}>
                                {step.label}
                            </Text>
                        </Pressable>

                        {/* Connector Line */}
                        {!isLastItem && (
                            <View style={styles.lineConnector}/>
                        )}
                    </React.Fragment>
                );
            })}


        </View>
    );
})
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    stepItemContainer: {
        alignItems: 'center',
        zIndex: 1,
    },
    outerCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        backgroundColor: COLORS.white,
    },
    innerCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '500',
        marginTop: 4,
        maxWidth: 80,
    },
    lineConnector: {
        flex: 1,
        height: 2,
        backgroundColor: COLORS.line,
        marginTop: 22,
        marginHorizontal: -12,
        zIndex: 0,
    }
});
StepProgress.displayName = 'StepProgress';

export default StepProgress;

