const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Report {
  id: number;
  userId: number;
  type: 'bug' | 'dictionary' | 'feature' | 'other';
  comment: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    email: string;
    nickname: string | null;
  };
}

export interface CreateReportData {
  type: 'bug' | 'dictionary' | 'feature' | 'other';
  comment: string;
}

export interface ReportStats {
  overview: {
    totalReports: number;
    pendingReports: number;
    inProgressReports: number;
    resolvedReports: number;
    closedReports: number;
  };
  reportsByType: Array<{
    type: string;
    _count: { type: number };
  }>;
  recentReports: Report[];
}

export const reportApi = {
  async createReport(data: CreateReportData): Promise<Report> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create report');
    }

    return response.json();
  },

  async getUserReports(params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    reports: Report[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE}/reports/my?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }

    return response.json();
  },

  async getAdminReports(params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    reports: Report[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE}/reports/admin?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin reports');
    }

    return response.json();
  },

  async updateReport(id: number, data: {
    status?: string;
    adminNotes?: string;
  }): Promise<Report> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE}/reports/admin/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update report');
    }

    return response.json();
  },

  async getReportStats(): Promise<ReportStats> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE}/reports/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch report stats');
    }

    return response.json();
  }
};
