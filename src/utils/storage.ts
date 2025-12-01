import { MMKV } from 'react-native-mmkv';

const storageInstance = new MMKV();
const TOKEN_KEY = 'ACCESS_TOKEN';

export const storage = {
    // 1. Hàm lưu token (Gọi sau khi Login thành công)
    setToken: async (token: string) => {
        try {
            storageInstance.set(TOKEN_KEY, token);
        } catch (e) {
            console.error("Lỗi lưu token", e);
        }
    },

    getToken: async (): Promise<string | null> => {
        try {
            const token = storageInstance.getString(TOKEN_KEY);
            return token || null;
        } catch (e) {
            return null;
        }
    },

    // 3. Xóa token (Gọi khi Logout)
    clearToken: async () => {
        storageInstance.delete(TOKEN_KEY);
    }
};
