import { createMMKV } from "react-native-mmkv";

const storageInstance = createMMKV();

const TOKEN_KEY = "ACCESS_TOKEN";

export const storage = {
    setToken: (token: string) => {
        try {
            storageInstance.set(TOKEN_KEY, token);
        } catch (e) {
            console.error("Lỗi lưu token", e);
        }
    },

    getToken: (): string | null => {
        try {
            const token = storageInstance.getString(TOKEN_KEY);
            return token ?? null;
        } catch (e) {
            return null;
        }
    },

    clearToken: () => {
        storageInstance.remove(TOKEN_KEY);
    }
};
