import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
    initModel(): Promise<string>;
    startStreamingResponse(prompt: string): void;
    resetConversation(): Promise<string>;
    shutdown(): Promise<string>;

    addListener(eventName: string): void;
    removeListeners(count: number): void;

}

export default TurboModuleRegistry.getEnforcing<Spec>('GenAIModule');