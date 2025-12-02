import { ApiClient } from './ApiClient';
import { getResultWithResponse } from '../utils/BaseApiHelper';
import {SearchWorkResponse, BaseResponse} from '../model/types';
import { Resource } from '../utils/Resource';

class WorkService extends ApiClient {

    public async searchWork(userId: number): Promise<Resource<BaseResponse<SearchWorkResponse>>> {

        return getResultWithResponse(async () => {

            const payload = {
                "query": {
                    "bool": {
                        "must": [
                            // 1. Điều kiện thời gian
                            {
                                "range": {
                                    "workCreatedDate": {
                                        "gte": "now-3M/d"
                                    }
                                }
                            },
                            // 2. Điều kiện loại trừ (must_not)
                            {
                                "bool": {
                                    "must_not": [
                                        {
                                            "match": {
                                                "workStatusId": 0
                                            }
                                        }
                                    ]
                                }
                            },
                            // 3. Danh sách loại công việc (workTypeId)
                            {
                                "terms": {
                                    "workTypeId": [
                                        "3", "2", "57", "51", "50", "53"
                                    ]
                                }
                            },
                            // 4. Tiến độ công việc (workProgressId)
                            {
                                "match": {
                                    "workProgressId": 7
                                }
                            },
                            // 5. Nhóm công việc (workGroupId) - Phần mới bổ sung
                            {
                                "terms": {
                                    "workGroupId": [
                                        "#GROUPID" // Thay thế "#GROUPID" bằng biến thực tế
                                    ]
                                }
                            },
                            // 6. Nhóm hệ thống (workSystemGroup) - Phần mới bổ sung
                            {
                                "match": {
                                    "workSystemGroup": "QLCTKT"
                                }
                            }
                        ]
                    }
                }
            };
            return this.instance.post<BaseResponse<SearchWorkResponse>>(
                '/searchESController/getWorksDashboardItem',
                payload,
                { params: { userAssignId: userId, pageIndex:1, pageSize:1000 } }
            );
        });
    }

    public async getTokenByUserName(userName: string): Promise<Resource<BaseResponse<string>>> {
        return getResultWithResponse(async () => {
            return this.instance.get<BaseResponse<string>>(
                'generateTokenController/getTokenByUsername',
                { params: { username: userName } }
            );
        });
    }
}

export const workService = new WorkService();