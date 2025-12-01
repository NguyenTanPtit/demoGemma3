// Định nghĩa các trạng thái
export type Resource<T> =
    | { status: 'loading' }
    | { status: 'error'; error: Error; message: string }
    | { status: 'success'; data: T | null };

// Helper để tạo object nhanh (giống Constructor trong Kotlin)
export const Resource = {
    loading: (): Resource<never> => ({ status: 'loading' }),

    error: (error: any): Resource<never> => {
        const message = error?.message || "Unknown Error";
        return { status: 'error', error: error instanceof Error ? error : new Error(message), message };
    },

    success: <T>(data: T | null): Resource<T> => ({ status: 'success', data }),
};