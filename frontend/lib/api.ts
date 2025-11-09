export const api = {
    async fetchWithAuth(url: string, options: RequestInit = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        };
        return fetch(url, { ...options, headers });
    },
};
