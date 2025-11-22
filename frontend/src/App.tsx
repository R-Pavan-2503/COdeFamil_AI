import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard.tsx';
import RepoView from './pages/RepoView.tsx';
import CommitView from './pages/CommitView.tsx';
import PRView from './pages/PRView.tsx';
import PullRequestView from './pages/PullRequestView.tsx';
import FileTreeView from './pages/FileTreeView.tsx';
import FileView from './pages/FileView.tsx';
import { api } from './utils/api';

function App() {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        // Check for OAuth callback
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code && !user) {
            api.githubCallback(code)
                .then(data => {
                    if (data && data.user && data.accessToken) {
                        setUser(data.user);
                        setToken(data.accessToken);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        localStorage.setItem('token', data.accessToken);
                        window.history.replaceState({}, '', '/');
                        setError('');
                    } else {
                        setError('Invalid response from server');
                    }
                })
                .catch(err => {
                    console.error('OAuth callback error:', err);
                    setError('Authentication failed. Backend may not be running or database is not configured.');
                    // Clear the code from URL
                    window.history.replaceState({}, '', '/');
                });
        } else {
            const savedUser = localStorage.getItem('user');
            const savedToken = localStorage.getItem('token');
            if (savedUser && savedToken && savedUser !== 'undefined' && savedToken !== 'undefined') {
                try {
                    setUser(JSON.parse(savedUser));
                    setToken(savedToken);
                } catch (e) {
                    // Clear invalid localStorage
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
            }
        }
    }, []);

    const handleLogin = async () => {
        try {
            const result = await api.githubLogin(window.location.origin);
            if (result && result.url) {
                window.location.href = result.url;
            } else {
                setError('Failed to get OAuth URL from backend');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Backend is not responding. Make sure the backend is running on port 5000.');
        }
    };

    if (!user) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <h1>CodeFamily</h1>
                <p>AI-Powered Engineering Intelligence Platform</p>

                {error && (
                    <div style={{
                        padding: '16px',
                        margin: '20px auto',
                        maxWidth: '600px',
                        background: '#da363320',
                        border: '1px solid #da3633',
                        borderRadius: '6px',
                        color: '#f85149'
                    }}>
                        <strong>⚠️ Error:</strong> {error}
                        <div style={{ marginTop: '12px', fontSize: '14px', color: '#c9d1d9' }}>
                            <strong>Troubleshooting:</strong>
                            <ul style={{ textAlign: 'left', marginTop: '8px' }}>
                                <li>Make sure backend is running: <code>dotnet run</code></li>
                                <li>Backend should be at: http://localhost:5000</li>
                                <li>Supabase database must be configured in settings.json</li>
                            </ul>
                        </div>
                    </div>
                )}

                <button className="btn btn-primary" onClick={handleLogin}>
                    Login with GitHub
                </button>

                <div style={{ marginTop: '40px', fontSize: '14px', color: '#8b949e' }}>
                    <strong>System Status:</strong>
                    <div style={{ marginTop: '12px' }}>
                        <div>Frontend: ✅ Running</div>
                        <div>Backend: {error ? '❌ Not responding' : '⏳ Checking...'}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <div className="header">
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
                        CodeFamily
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {user.avatarUrl && <img src={user.avatarUrl} alt={user.username} style={{ width: 32, height: 32, borderRadius: '50%' }} />}
                        <span>{user.username}</span>
                    </div>
                </div>
            </div>

            <Routes>
                <Route path="/" element={<Dashboard user={user} token={token} />} />
                <Route path="/repo/:repositoryId" element={<RepoView user={user} />} />
                <Route path="/commit/:commitId" element={<CommitView />} />
                <Route path="/pr/:prId" element={<PRView />} />
                <Route path="/pr/:owner/:repo/:prNumber" element={<PullRequestView user={user} />} />
                <Route path="/file/:fileId" element={<FileView />} />
                <Route path="/filetree/:fileId" element={<FileTreeView />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
