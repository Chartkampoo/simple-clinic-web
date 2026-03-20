const API_BASE_URL = 'http://localhost:9999/api';

const api = {
    async request(endpoint, method = 'GET', body = null, token = null) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            // Try to get response data, but handle non-JSON responses gracefully
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = { message: await response.text() };
            }

            if (!response.ok) {
                // Return a more user-friendly error if possible
                const errorMsg = data.message || data || 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
                throw new Error(errorMsg);
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            // If it's already an error object with a message, keep it, otherwise translate to Thai
            if (error.message && error.message.includes('fetch')) {
                throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
            }
            throw error;
        }
    },

    auth: {
        login: (credentials) => api.request('/auth/login', 'POST', credentials),
        register: (userData) => api.request('/auth/register', 'POST', userData),
        getDoctors: (token) => api.request('/auth/doctors', 'GET', null, token),
        updateProfile: (data, token) => api.request('/auth/profile', 'PATCH', data, token),
    },

    patients: {
        getAll: (token) => api.request('/patients', 'GET', null, token),
        getById: (id, token) => api.request(`/patients/${id}`, 'GET', null, token),
        update: (id, data, token) => api.request(`/patients/${id}`, 'PUT', data, token),
    },

    appointments: {
        getAll: (token) => api.request('/appointments', 'GET', null, token),
        create: (data, token) => api.request('/appointments', 'POST', data, token),
        updateStatus: (id, status, token) => api.request(`/appointments/${id}/status`, 'PATCH', { status }, token),
        delete: (id, token) => api.request(`/appointments/${id}`, 'DELETE', null, token),
    },

    medicalRecords: {
        create: (data, token) => api.request('/medical-records', 'POST', data, token),
        getByPatientId: (patientId, token) => api.request(`/medical-records/patient/${patientId}`, 'GET', null, token),
    }
};
