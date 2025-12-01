import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'ACCESS_TOKEN';

export const storage = {
    // 1. Hàm lưu token (Gọi sau khi Login thành công)
    setToken: async (token: string) => {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
        } catch (e) {
            console.error("Lỗi lưu token", e);
        }
    },

    getToken: async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(TOKEN_KEY);
        } catch (e) {
            return null;
        }
    },

    // 3. Xóa token (Gọi khi Logout)
    clearToken: async () => {
        await AsyncStorage.removeItem(TOKEN_KEY);
    }
};