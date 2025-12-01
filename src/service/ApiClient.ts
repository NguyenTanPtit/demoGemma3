// src/api/core/ApiClient.ts
import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, AxiosHeaders} from 'axios';
import { BaseResponse } from '../model/types.ts';
import { storage } from '../utils/storage.ts';

// Cấu hình mặc định (Giống Constants)
const BASE_URL = 'https://117.5.230.208:8899/QLCTKT/rest/';
const TIMEOUT = 30000;

export abstract class ApiClient {
    protected readonly instance: AxiosInstance;

    constructor(baseURL: string = BASE_URL) {
        // 1. Chỉ cấu hình những cái "Tĩnh" (cố định)
        this.instance = axios.create({
            baseURL,
            timeout: TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
        this.instance.interceptors.request.use(
            async (config) => {
                const token = await storage.getToken();

                if (!config.headers) {
                    config.headers = new AxiosHeaders();
                }

                const headers = config.headers as AxiosHeaders;

                if (token) {
                    headers.set('token', token);
                }

                headers.set('username', 'act_d00184215');

                return config;
            },
            (error) => Promise.reject(error)
        );

        this.initializeResponseInterceptor();
    }

    private initializeResponseInterceptor() {
        this.instance.interceptors.response.use(
            (response) => {
                return response;
            },
            (error: AxiosError) => {
                this.handleError(error);
                return Promise.reject(error);
            }
        );
    }

    // --- Hàm xử lý lỗi tập trung ---
    private handleError(error: AxiosError) {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    console.log("Token hết hạn - Cần logout hoặc refresh token");
                    break;
                case 403:
                    console.log("Không có quyền truy cập");
                    break;
                case 500:
                    console.log("Lỗi Server");
                    break;
                default:
                    console.log("Lỗi khác:", error.message);
            }
        } else {
            console.log("Lỗi mạng / Network Error");
        }
    }

    protected async get<T>(url: string, params?: any): Promise<BaseResponse<T>> {
        const response = await this.instance.get<BaseResponse<T>>(url, { params });
        return response.data;
    }

    protected async post<T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<BaseResponse<T>> {
        const response = await this.instance.post<BaseResponse<T>>(url, body, config);
        return response.data;
    }


}