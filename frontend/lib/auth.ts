const isBrowser = typeof window !== 'undefined';

export const auth = {
    setToken(token: string) {
        if (isBrowser) {
            localStorage.setItem('token', token);
            try {
                window.dispatchEvent(new CustomEvent('auth:change', { detail: { isLoggedIn: true } }));
            } catch {}
        }
    },
    getToken() {
        if (isBrowser) {
            return localStorage.getItem('token');
        }
        return null;
    },
    removeToken() {
        if (isBrowser) {
            localStorage.removeItem('token');
            try {
                window.dispatchEvent(new CustomEvent('auth:change', { detail: { isLoggedIn: false } }));
            } catch {}
        }
    },
    getUserId() {
        const token = this.getToken();
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id as number;
    },
    getUserEmail() {
        const token = this.getToken();
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email as string;
    },
};
