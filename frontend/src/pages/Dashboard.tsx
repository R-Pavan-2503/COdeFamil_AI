import { useEffect, useState } from 'react';
import { api } from '../utils/api';

interface DashboardProps {
    user: any;
    token: string;
}

export default function Dashboard({ user, token }: DashboardProps) {
    const [repos, setRepos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());
    const [checkingStatus, setCheckingStatus] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadRepositories();
    }, []);

    const loadRepositories = async () => {
        try {
            const data = await api.getRepositories(token, user.id);
            console.log('Repositories from GitHub:', data);
            setRepos(Array.isArray(data) ? data : []);
            setError('');
        } catch (err: any) {
            console.error('Failed to load repositories:', err);
            setError(err.message || 'Failed to load repositories from GitHub');
            setRepos([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async (owner: string, name: string) => {
        const key = `${owner}/${name}`;
        setAnalyzing(prev => new Set(prev).add(key));

        try {
            const result = await api.analyzeRepository(owner, name, user.id);
            console.log('Analysis started:', result);
            alert(`✅ Analysis started for ${owner}/${name}!\n\nThis will take a few minutes. The status will update automatically.`);
            // Reload to show updated status
            await loadRepositories();
        } catch (error: any) {
            console.error('Analysis failed:', error);
            alert(`❌ Analysis failed: ${error.message || 'Unknown error'}`);
        } finally {
            setAnalyzing(prev => {
                const newSet = new Set(prev);
                newSet.delete(key);
                return newSet;
            });
        }
    };

    const handleViewAnalysis = async (owner: string, name: string) => {
        const key = `${owner}/${name}`;
        setCheckingStatus(prev => new Set(prev).add(key));

        try {
            const status = await api.getRepositoryStatus(owner, name);
            console.log('Repository status:', status);

            if (!status.analyzed) {
                alert('Repository has not been analyzed yet. Click "Analyze" first!');
                return;
            }

            if (status.status === 'ready') {
                // Navigate to analysis view
                window.location.href = `/repo/${status.repositoryId}`;
            } else if (status.status === 'analyzing') {
                alert('Analysis is still in progress. Please wait a few minutes and try again.');
            } else if (status.status === 'pending') {
                alert('Analysis is queued and will start soon.');
            } else {
                alert(`Repository status: ${status.status}`);
            }
        } catch (error: any) {
            console.error('Failed to check status:', error);
            alert(`Error checking status: ${error.message}`);
        } finally {
            setCheckingStatus(prev => {
                const newSet = new Set(prev);
                newSet.delete(key);
                return newSet;
            });
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <h2>Loading your repositories from GitHub...</h2>
                <p style={{ color: '#8b949e', marginTop: '12px' }}>This may take a few seconds</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <h1>Your Repositories</h1>
                <div style={{
                    padding: '20px',
                    background: '#da363320',
                    border: '1px solid #da3633',
                    borderRadius: '6px',
                    color: '#f85149',
                    marginTop: '20px'
                }}>
                    <strong>⚠️ Error:</strong> {error}
                    <div style={{ marginTop: '12px', fontSize: '14px', color: '#c9d1d9' }}>
                        Make sure:
                        <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                            <li>The backend is running</li>
                            <li>Your GitHub access token is valid</li>
                            <li>You granted the required permissions to the GitHub App</li>
                        </ul>
                    </div>
                    <button
                        onClick={loadRepositories}
                        className="btn"
                        style={{ marginTop: '16px', background: '#21262d' }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (repos.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '60px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
                <h1>Welcome, {user.username}!</h1>
                <p style={{ color: '#8b949e', marginTop: '20px', fontSize: '18px' }}>
                    No repositories found in your GitHub account.
                </p>
                <p style={{ color: '#8b949e', marginTop: '12px', fontSize: '14px' }}>
                    Create a repository on GitHub to get started!
                </p>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1>Your Repositories ({repos.length})</h1>
                <button
                    onClick={loadRepositories}
                    className="btn"
                    style={{ background: '#21262d', fontSize: '14px' }}
                >
                    🔄 Refresh
                </button>
            </div>

            <div className="repo-list">
                {repos.map((repo: any) => {
                    const key = `${repo.login}/${repo.name}`;
                    const isAnalyzing = analyzing.has(key);
                    const isCheckingStatus = checkingStatus.has(key);
                    const isAnalyzed = repo.analyzed === true;
                    const status = repo.status;

                    return (
                        <div key={repo.id} className="card repo-card" style={{ position: 'relative' }}>
                            <div className="repo-info">
                                <h3>{repo.login}/{repo.name}</h3>
                                <p style={{ color: '#8b949e', fontSize: '14px' }}>
                                    {repo.description || 'No description'}
                                </p>
                                {isAnalyzed && (
                                    <div style={{ marginTop: '8px' }}>
                                        {status === 'ready' ? (
                                            <span style={{
                                                color: '#3fb950',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                ✅ Analysis Complete
                                            </span>
                                        ) : status === 'analyzing' ? (
                                            <span style={{
                                                color: '#f0883e',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                ⏳ Analyzing...
                                            </span>
                                        ) : status === 'pending' ? (
                                            <span style={{
                                                color: '#8b949e',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                ⏸️ Pending
                                            </span>
                                        ) : (
                                            <span style={{
                                                color: '#8b949e',
                                                fontSize: '12px'
                                            }}>
                                                Status: {status}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                {isAnalyzing ? (
                                    <button
                                        className="btn"
                                        style={{ background: '#21262d' }}
                                        disabled
                                    >
                                        ⏳ Starting...
                                    </button>
                                ) : !isAnalyzed ? (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleAnalyze(repo.login, repo.name)}
                                    >
                                        🔍 Analyze
                                    </button>
                                ) : isCheckingStatus ? (
                                    <button
                                        className="btn"
                                        style={{ background: '#21262d' }}
                                        disabled
                                    >
                                        🔍 Checking...
                                    </button>
                                ) : status === 'ready' ? (
                                    <button
                                        className="btn"
                                        style={{ background: '#388bfd20', color: '#58a6ff' }}
                                        onClick={() => handleViewAnalysis(repo.login, repo.name)}
                                    >
                                        📊 View Analysis
                                    </button>
                                ) : (
                                    <button
                                        className="btn"
                                        style={{ background: '#21262d' }}
                                        onClick={() => handleViewAnalysis(repo.login, repo.name)}
                                    >
                                        {status === 'analyzing' ? '⏳ Check Status' : '🔍 Check Status'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{
                marginTop: '40px',
                padding: '16px',
                background: '#161b2220',
                border: '1px solid #30363d',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#8b949e'
            }}>
                <strong style={{ color: '#c9d1d9' }}>💡 How it works:</strong>
                <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                    <li>Repositories are fetched from your GitHub account</li>
                    <li>Click "🔍 Analyze" to clone and analyze a repository</li>
                    <li>Analysis includes: Git history parsing, semantic embeddings, and ownership calculation</li>
                    <li>Click "📊 View Analysis" when status is ✅ to see detailed insights</li>
                    <li>Use "🔄 Refresh" to update repository statuses</li>
                </ul>
            </div>
        </div>
    );
}
