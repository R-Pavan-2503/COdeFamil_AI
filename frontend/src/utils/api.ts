const API_BASE = 'http://localhost:5000';

async function handleResponse(res: Response) {
    if (!res.ok) {
        const text = await res.text();
        try {
            const json = JSON.parse(text);
            throw new Error(json.error || json.message || 'Request failed');
        } catch {
            throw new Error(text || `HTTP ${res.status}: ${res.statusText}`);
        }
    }

    const text = await res.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

export const api = {
    // Auth
    async githubLogin(redirectUri: string) {
        const res = await fetch(`${API_BASE}/auth/github?redirectUri=${redirectUri}`);
        return handleResponse(res);
    },

    async githubCallback(code: string) {
        const res = await fetch(`${API_BASE}/auth/github/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        return handleResponse(res);
    },

    // Repositories
    async getRepositories(token: string, userId: string) {
        const res = await fetch(`${API_BASE}/repositories?userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(res);
    },

    async analyzeRepository(owner: string, repo: string, userId: string) {
        const res = await fetch(`${API_BASE}/repositories/${owner}/${repo}/analyze?userId=${userId}`, {
            method: 'POST'
        });
        return handleResponse(res);
    },

    async getRepositoryStatus(owner: string, repo: string) {
        const res = await fetch(`${API_BASE}/repositories/${owner}/${repo}/status`);
        return handleResponse(res);
    },

    async getRepository(id: string) {
        const res = await fetch(`${API_BASE}/repositories/${id}`);
        return handleResponse(res);
    },

    // Commits
    async getCommits(repositoryId: string) {
        const res = await fetch(`${API_BASE}/commits/repository/${repositoryId}`);
        return handleResponse(res);
    },

    // Files
    async getFiles(repositoryId: string) {
        const res = await fetch(`${API_BASE}/files/repository/${repositoryId}`);
        return handleResponse(res);
    },

    async getPullRequests(repositoryId: string) {
        const res = await fetch(`${API_BASE}/pullrequests/repository/${repositoryId}`);
        return handleResponse(res);
    },

    async getPullRequestDetails(owner: string, repo: string, prNumber: number, token?: string) {
        const headers: any = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE}/pullrequests/${owner}/${repo}/${prNumber}/details`, {
            headers
        });
        return handleResponse(res);
    },

    async getFileAnalysis(fileId: string) {
        const res = await fetch(`${API_BASE}/files/${fileId}`);
        return handleResponse(res);
    },

    async getAnalyzedRepositories(userId: string, filter: 'your' | 'others' | 'all') {
        const res = await fetch(`${API_BASE}/repositories/analyzed?userId=${userId}&filter=${filter}`);
        return handleResponse(res);
    },

    async analyzeRepositoryByUrl(url: string, userId: string) {
        const res = await fetch(`${API_BASE}/repositories/analyze-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, userId })
        });
        return handleResponse(res);
    }
};
