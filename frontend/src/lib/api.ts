const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function apiFetch(endpoint: string, options: any = {}) {
    const token = localStorage.getItem('token');
    const { responseType, body, ...fetchOptions } = options;

    const headers: any = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    let finalBody = body;

    // Handle JSON body automatically if it's a plain object
    if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        finalBody = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers,
        body: finalBody,
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
            response: {
                status: response.status,
                data: errorData
            }
        };
    }

    if (responseType === 'blob') {
        return {
            data: await response.blob()
        };
    }

    return {
        data: await response.json().catch(() => ({}))
    };
}

export default apiFetch;
