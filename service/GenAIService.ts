import { NativeModules } from 'react-native';

const { GenAIModule } = NativeModules;


const initGenAI = async () => {
    try {
        console.log("Initializing model...");
        const result = await GenAIModule.initModel();
        console.log(result); // "Model initialized successfully"
    } catch (e) {
        console.error("Init failed", e);
    }
};


const chatWithGemma = async (msg: string) => {
    try {
        console.log("Thinking...");
        const response = await GenAIModule.generateResponse(msg);
        console.log("Gemma says:", response);
        return response;
    } catch (e) {
        console.error("Generation failed", e);
    }
};