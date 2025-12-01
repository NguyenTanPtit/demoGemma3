// src/api/services/WorkService.ts
import { ApiClient } from './ApiClient'; // Class Base Axios ta đã tạo ở câu trước
import { getResultWithResponse } from '../utils/BaseApiHelper'; // Hàm vừa tạo
import {SearchWorkRequest, SearchWorkResponse} from '../model/types';
import { Resource } from '../utils/Resource';

class WorkService extends ApiClient {

    public async searchWork(userId: number, request: SearchWorkRequest): Promise<Resource<SearchWorkResponse>> {

        return getResultWithResponse(async () => {
            return this.instance.post<SearchWorkResponse>(
                '/searchESController/searchWork',
                request,
                { params: { userAssignId: userId } }
            );
        });
    }

    public async getTokenByUserName(userName: string): Promise<Resource<string>> {
        return getResultWithResponse(async () => {
            return this.instance.get<string>(
                'generateTokenController/getTokenByUsername',
                { params: { userName } }
            );
        });
    }
}

export const workService = new WorkService();