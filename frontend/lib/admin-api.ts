const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface AdminStats {
  overview: {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    activeUsersToday: number;
    activeUsersThisWeek: number;
    totalDictionaries: number;
    publicDictionaries: number;
    privateDictionaries: number;
    dictionariesThisWeek: number;
    dictionariesThisMonth: number;
    totalWords: number;
    totalUserWords: number;
    learnedWords: number;
    totalSessions: number;
    sessionsToday: number;
    totalHints: number;
    hintsToday: number;
  };
  learningStats: {
    averageLearnedWords: number;
    usersWithStreaks: number;
    longestStreak: number;
    averageSessionScore: number;
    totalRecalledWords: number;
    totalNotRecalledWords: number;
  };
  languageStats: Array<{
    id: number;
    code: string;
    name: string;
    _count: {
      words: number;
      userLearnedWords: number;
    };
  }>;
  topUsers: Array<{
    id: number;
    email: string;
    nickname: string | null;
    createdAt: string;
    stats: {
      learnedCount: number;
      streak: number;
      totalSessions: number;
      lastActive: string;
    } | null;
    _count: {
      learnedWords: number;
      sessions: number;
      dictionaries: number;
    };
    learnedTrueCount?: number;
  }>;
  topDictionaries: Array<{
    id: number;
    name: string;
    description: string | null;
    likes: number;
    createdAt: string;
    createdBy: {
      nickname: string | null;
    };
    _count: {
      words: number;
      sessions: number;
    };
  }>;
  dailyStats: Array<{
    date: string;
    newUsers: number;
    newSessions: number;
    newHints: number;
  }>;
  modeStats: {
    totals: Record<string, number>;
    series: Record<string, Array<{ date: string; sessions: number }>>;
  };
}

export const adminApi = {
  async getStats(username: string, password: string): Promise<AdminStats> {
    const credentials = btoa(`${username}:${password}`);
    
    const response = await fetch(`${API_BASE}/admin/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin stats');
    }

    return response.json();
  },

  async getUserDetails(userId: number, username: string, password: string) {
    const credentials = btoa(`${username}:${password}`);
    
    const response = await fetch(`${API_BASE}/admin/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/users/${userId}`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }

    return response.json();
  },

  async getReports(username: string, password: string, params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const credentials = btoa(`${username}:${password}`);
    
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE}/admin/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/reports?${searchParams}`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin reports');
    }

    return response.json();
  },

  async getReportStats(username: string, password: string) {
    const credentials = btoa(`${username}:${password}`);
    
    const response = await fetch(`${API_BASE}/admin/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/reports/stats`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch report stats');
    }

    return response.json();
  },

  async updateReportStatus(
    username: string,
    password: string,
    id: number,
    status: 'pending' | 'in_progress' | 'resolved'
  ) {
    const credentials = btoa(`${username}:${password}`);

    const response = await fetch(`${API_BASE}/admin/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/reports/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update report status');
    }

    return response.json();
  }
  ,

  async getDictionaries(username: string, password: string, params?: { limit?: number; offset?: number }) {
    const credentials = btoa(`${username}:${password}`);
    const url = new URL(`${API_BASE}/admin/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/dictionaries`);
    if (params?.limit != null) url.searchParams.set('limit', String(params.limit));
    if (params?.offset != null) url.searchParams.set('offset', String(params.offset));

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch dictionaries');
    return response.json() as Promise<{ items: any[]; total: number }>;
  }
  ,

  async deleteDictionary(id: number, username: string, password: string) {
    const credentials = btoa(`${username}:${password}`);
    const response = await fetch(`${API_BASE}/admin/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/dictionaries/${id}` , {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete dictionary');
    return true;
  }
};
