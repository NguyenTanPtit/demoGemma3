import { AxiosResponse, AxiosError } from 'axios';
import { Resource } from './Resource.ts';
import {VSmartAPIException} from "./VSmartAPIException.ts";

// Định nghĩa Custom Error giống VSmartAPIException
class APINoDataException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "APINoDataException";
    }
}

// Hàm generic T wrapper
export const getResultWithResponse = async <T>(
    apiCall: () => Promise<AxiosResponse<T>>
): Promise<Resource<T>> => {
    let responseCode = 0;

    try {
        const response = await apiCall();
        responseCode = response.status;

        const contentType = response.headers['content-type'];
        const message = response.headers['message'];

        if (contentType === "LOGIN FALSE TOKEN") {
            return Resource.error(new Error("Session Expired!"));
        }

        if (responseCode === 204 && message) {
            return Resource.error(new APINoDataException(message));
        }

        // Logic 3: Success Cases
        if (responseCode === 204) {
            return Resource.success(null);
        } else {
            return Resource.success(response.data);
        }

    } catch (e: any) {
        console.error("API Error:", e);

        // Xử lý Axios Error
        if (e.response) {
            // Server trả về response nhưng code không phải 2xx
            responseCode = e.response.status;
        }
        if (responseCode === 200) {
            return Resource.success(null);
        }

        if (e instanceof VSmartAPIException) {
            return Resource.error(e.getUserMessage());
        }

        return Resource.error(e);
    }
};