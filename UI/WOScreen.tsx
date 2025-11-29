import {View} from "react-native";
import Header from "./Header.tsx";
import Progress, {StepData} from "./Progress.tsx";
import CheckInCard from "./CheckInComponent.tsx";
import TabLayout from "./TabLayout.tsx";


const stepDataList: StepData[] = [
    { id: 1, label: "Đấu nối", iconName: "settings" },
    { id: 2, label: "Test tích hợp", iconName: "checklist" },
    { id: 3, label: "Nghiệm thu", iconName: "person" },
    { id: 4, label: "Hồ sơ", iconName: "help" },
];
const WOScreen = () => {
    return <View>
        <Header/>
        <TabLayout/>
        <Progress steps={stepDataList} currentStepIndex={2} />
        <CheckInCard/>
    </View>;
}

export default WOScreen;