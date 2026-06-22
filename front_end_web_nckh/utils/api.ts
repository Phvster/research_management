import queryString from 'query-string';

interface IRequest {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
    body?: any;
    queryParams?: any;
    useCredentials?: boolean;
    headers?: HeadersInit;
    nextOption?: RequestInit;
}

export const sendRequest = async <T>(props: IRequest): Promise<T> => {
    let {
        url,
        method,
        body,
        queryParams = {},
        useCredentials = false,
        headers = {},
        nextOption = {}
    } = props;

    let token = '';
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken') || '';
    }

    const defaultHeaders = new Headers({
        'Content-Type': 'application/json',
        ...headers
    });

    if (token) {
        defaultHeaders.append('Authorization', `Bearer ${token}`);
    }

    const options: RequestInit = {
        method: method,
        headers: defaultHeaders,
        ...nextOption
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
        options.body = JSON.stringify(body);
    }

    if (useCredentials) {
        options.credentials = "include";
    }

    if (queryParams && Object.keys(queryParams).length > 0) {
        url = `${url}?${queryString.stringify(queryParams)}`;
    }

    const res = await fetch(url, options);
    let json;
    try {
        json = await res.json();
    } catch (err) {
        json = null;
    }

    if (res.ok) {
        return json as T;
    } else {
        // =========================================================
        // "TRẠM BÓC LỖI" THÔNG MINH CHO DJANGO REST FRAMEWORK
        // =========================================================
        let errorMessage = "Đã xảy ra lỗi hệ thống, vui lòng thử lại.";

        if (json) {
            if (json.detail) {
                // 1. Lỗi mặc định của Django (VD: "Vi phạm quy chế...", "Không có quyền...")
                errorMessage = json.detail;
            } else if (json.message) {
                // 2. Lỗi có field 'message' tùy chỉnh
                errorMessage = json.message;
            } else if (typeof json === 'object') {
                // 3. Lỗi bóc theo mảng trường (VD: {"TenDeTai": ["Trùng tên đề tài rồi"]})
                const keys = Object.keys(json);
                if (keys.length > 0) {
                    const firstError = json[keys[0]];
                    errorMessage = Array.isArray(firstError) ? String(firstError[0]) : String(firstError);
                }
            } else if (typeof json === 'string') {
                // 4. Lỗi text thô
                errorMessage = json;
            }
        }

        // Tạo một Error Object chuẩn Javascript
        const errorObj: any = new Error(errorMessage);
        errorObj.statusCode = res.status; // Vẫn giữ lại statusCode cho Frontend nếu cần check 401, 404...
        errorObj.errorData = json;        // Nhét lại cục JSON gốc vào để đề phòng

        throw errorObj;
    }
};