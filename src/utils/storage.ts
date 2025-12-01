
import { createMMKV } from 'react-native-mmkv';

const storageInstance = createMMKV();
const TOKEN_KEY = 'ACCESS_TOKEN';

export const storage = {
    // 1. Lưu token: Không cần async
    setToken: (token: string) => {
        try {
            storageInstance.set(TOKEN_KEY, token);
        } catch (e) {
            console.error("Lỗi lưu token", e);
        }
    },

    // 2. Lấy token: Trả về trực tiếp string | null (Không phải Promise)
    getToken: (): string | null => {
        try {
            const token = storageInstance.getString(TOKEN_KEY);
            return token || null; // Hoặc dùng token ?? null
        } catch (e) {
            return null;
        }
    },

    // 3. Xóa token
    clearToken: () => {
        storageInstance.remove(TOKEN_KEY);
    }
};