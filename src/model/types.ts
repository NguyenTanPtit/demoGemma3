// Request Body
export interface SearchWorkRequest {
    listDepartmentId: number[];
    workTypesMappingWO: any[];
    pageIndex: number;
    pageSize: number;
    searchDateFrom: string; // Format: YYYY-MM-DD
    searchDateTo: string;   // Format: YYYY-MM-DD
    searchDateType: string; // Vd: "CREATED_DATE"
    userHandles: string[];
    woCdGroupIds: any[];
    workCusInfo: string;
    workStatuses: string[];
}

// Tương ứng với WorkEntity
export interface WorkEntity {
    workId: number | null;
    workName: string | null;
    workCode: string;
    workTypeId: string | null;
    workTypeName: string | null;
    workProgressId: string | null;
    workProgressName: string | null;
    workStatusId: string | null;
    workStatusName: string | null;
    workDescription: string | null;
    workStartDate: string | null;
    workDeadline: string | null;
    workCreatedDate: string | null;
    workModifiedAt: string | null;
    workCusName: string | null;
    workCusPhone: string | null;
    workCusAcc: string | null;
    workGroupId: string | null;
    workStaffId: string | null;
    workStaffName: string | null;
    workStaffUsername: string | null;
    workStaffAvatar: string | null;
    workPriority: string | null;
    workSystemGroup: string | null;

    lstCd: string | null;
    woTypeCode: string | null;
    needStart: string | null;
    needStop: string | null;
}


export interface SearchWorkResponse {
    total: number;
    workList: WorkEntity[] | null;
}

export interface BaseResponse<T> {
    result: T;
}