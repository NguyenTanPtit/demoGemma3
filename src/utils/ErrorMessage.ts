import * as VSmart from './VSmartAPIException';
import { Strings } from '../constants/Strings';

export const getUserMessage = (error: any): string | null => {

    if (error instanceof VSmart.NoConnection) {
        return Strings.error_connect_server;
    }

    if (error instanceof VSmart.NoConnectionServer) {
        return Strings.error_mobile_data;
    }

    if (error instanceof VSmart.Timeout) {
        return Strings.request_timeout;
    }

    if (error instanceof VSmart.SystemError) {
        return error.responseMessage || Strings.have_an_error;
    }

    if (error instanceof VSmart.General) {
        return error.responseMessage || Strings.have_an_error;
    }

    // 3. Nhóm lỗi nghiệp vụ cụ thể (luôn lấy message từ object)
    if (error instanceof VSmart.GetAlertException) {
        return error.responseMessage;
    }

    if (error instanceof VSmart.LockCellException) {
        // Lưu ý: check null/undefined giống Kotlin để an toàn
        return error.errorMessage || Strings.have_an_error;
    }

    if (error instanceof VSmart.GetCabinetException) {
        return error.errorMessage || Strings.have_an_error;
    }

    if (error instanceof VSmart.ValidateCellException) {
        return error.errorMessage;
    }

    if (error instanceof VSmart.DataEmptyException) {
        return error.errorMessage || Strings.have_an_error;
    }

    if (error instanceof VSmart.APINoDataException) {
        return error.errorMessage || Strings.have_an_error;
    }

    if (error instanceof VSmart.NotSupportedMethodException) {
        return error.responseMessage;
    }

    if (error instanceof VSmart.WrongPassword) {
        return error.responseMessage || Strings.have_an_error;
    }

    // 4. Trường hợp hủy Request (Kotlin trả về null)
    if (error instanceof VSmart.CancellationException) {
        return null;
    }

    // 5. Default (else)
    // Trường hợp error không phải là VSmartAPIException (ví dụ lỗi JS thuần túy chưa map)
    return Strings.have_an_error;
};