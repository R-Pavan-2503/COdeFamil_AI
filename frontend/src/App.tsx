import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard.tsx';
import RepoView from './pages/RepoView.tsx';
import CommitView from './pages/CommitView.tsx';
import PRView from './pages/PRView.tsx';
import PullRequestView from './pages/PullRequestView.tsx';
import FileTreeView from './pages/FileTreeView.tsx';
import FileView from './pages/FileView.tsx';
import ThemeSelector from './components/ThemeSelector.tsx';
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
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-bg-primary)'
            }}>
                {/* Theme Selector - Top Right */}
                <div style={{
                    position: 'absolute',
                    top: 'var(--spacing-lg)',
                    right: 'var(--spacing-lg)',
                    zIndex: 10
                }}>
                    <ThemeSelector />
                </div>

                <div className="container" style={{
                    maxWidth: '450px',
                    textAlign: 'center'
                }}>
                    {/* Logo/Title */}
                    <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                        <h1 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-primary)' }}>
                            CodeFamily
                        </h1>
                        <p style={{
                            fontSize: 'var(--font-size-md)',
                            color: 'var(--color-text-secondary)'
                        }}>
                            AI-Powered Engineering Intelligence Platform
                        </p>
                    </div>

                    {/* Login Card */}
                    <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                        {error && (
                            <div style={{
                                padding: 'var(--spacing-lg)',
                                marginBottom: 'var(--spacing-lg)',
                                background: 'rgba(248, 81, 73, 0.1)',
                                border: '1px solid var(--color-error)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-error)'
                            }}>
                                <div style={{
                                    fontWeight: 'var(--font-weight-semibold)',
                                    marginBottom: 'var(--spacing-sm)'
                                }}>
                                    Error
                                </div>
                                <p style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
                                    {error}
                                </p>
                                <div style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-text-secondary)',
                                    textAlign: 'left',
                                    background: 'var(--color-bg-primary)',
                                    padding: 'var(--spacing-sm)',
                                    borderRadius: 'var(--radius-sm)'
                                }}>
                                    <strong style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>Troubleshooting:</strong>
                                    <ul style={{ marginLeft: 'var(--spacing-lg)', lineHeight: 1.6 }}>
                                        <li>Make sure backend is running: <code>dotnet run</code></li>
                                        <li>Backend should be at: http://localhost:5000</li>
                                        <li>Supabase database must be configured</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        <button
                            className="btn btn-primary"
                            onClick={handleLogin}
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-md) var(--spacing-lg)'
                            }}
                        >
                            Login with GitHub
                        </button>

                        <div style={{
                            marginTop: 'var(--spacing-lg)',
                            padding: 'var(--spacing-md)',
                            background: 'var(--color-bg-primary)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-xs)'
                        }}>
                            <div style={{
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--color-text-secondary)',
                                marginBottom: 'var(--spacing-sm)'
                            }}>
                                System Status
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', textAlign: 'left' }}>
                                <div style={{ color: 'var(--color-success)' }}>
                                    ✓ Frontend: Running
                                </div>
                                <div style={{ color: error ? 'var(--color-error)' : 'var(--color-warning)' }}>
                                    {error ? '✗' : '...'} Backend: {error ? 'Not responding' : 'Checking...'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            {/* Modern Header */}
            <div className="header">
                <div className="container" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--spacing-md) var(--spacing-xl)'
                }}>
                    {/* Logo */}
                    <h2
                        style={{
                            cursor: 'pointer',
                            margin: 0,
                            fontSize: 'var(--font-size-2xl)',
                            fontWeight: 'var(--font-weight-black)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            transition: 'transform var(--transition-base)'
                        }}
                        onClick={() => window.location.href = '/'}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <span>👨‍👩‍👧‍👦</span>
                        <span className="gradient-text">CodeFamily</span>
                    </h2>

                    {/* User Info + Theme Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                        <ThemeSelector />

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            background: 'var(--color-bg-elevated)',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--color-border-primary)',
                            transition: 'all var(--transition-base)'
                        }}>
                            {user.avatarUrl && (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.username}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        border: '2px solid var(--color-primary)',
                                        boxShadow: '0 0 12px rgba(124, 58, 237, 0.4)'
                                    }}
                                />
                            )}
                            <span style={{
                                fontWeight: 'var(--font-weight-semibold)',
                                fontSize: 'var(--font-size-base)',
                                color: 'var(--color-text-primary)'
                            }}>
                                {user.username}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Routes with fade-in animation */}
            <div className="animate-fadeIn">
                <Routes>
                    <Route path="/" element={<Dashboard user={user} token={token} />} />
                    <Route path="/repo/:repositoryId" element={<RepoView user={user} />} />
                    <Route path="/commit/:commitId" element={<CommitView />} />
                    <Route path="/pr/:prId" element={<PRView />} />
                    <Route path="/pr/:owner/:repo/:prNumber" element={<PullRequestView user={user} />} />
                    <Route path="/file/:fileId" element={<FileView />} />
                    <Route path="/filetree/:fileId" element={<FileTreeView />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;

