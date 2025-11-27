import { useEffect, useState } from 'react';
import { api } from '../utils/api';

interface DashboardProps {
    user: any;
    token: string;
}

type TabType = 'your' | 'analyzed' | 'add';
type FilterType = 'your' | 'others' | 'all';

export default function Dashboard({ user, token }: DashboardProps) {
    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('your');

    // Your repositories tab state
    const [repos, setRepos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());
    const [checkingStatus, setCheckingStatus] = useState<Set<string>>(new Set());

    // Analyzed repositories tab state
    const [analyzedRepos, setAnalyzedRepos] = useState<any[]>([]);
    const [analyzedFilter, setAnalyzedFilter] = useState<FilterType>('all');
    const [loadingAnalyzed, setLoadingAnalyzed] = useState(false);
    const [analyzedError, setAnalyzedError] = useState<string>('');

    // Add repository tab state
    const [repoUrl, setRepoUrl] = useState('');
    const [addingRepo, setAddingRepo] = useState(false);
    const [addError, setAddError] = useState<string>('');
    const [addSuccess, setAddSuccess] = useState<string>('');

    useEffect(() => {
        loadRepositories();
    }, []);

    useEffect(() => {
        if (activeTab === 'analyzed') {
            loadAnalyzedRepositories();
        }
    }, [activeTab, analyzedFilter]);

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

    const loadAnalyzedRepositories = async () => {
        setLoadingAnalyzed(true);
        setAnalyzedError('');
        try {
            const data = await api.getAnalyzedRepositories(user.id, analyzedFilter);
            setAnalyzedRepos(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Failed to load analyzed repositories:', err);
            setAnalyzedError(err.message || 'Failed to load analyzed repositories');
            setAnalyzedRepos([]);
        } finally {
            setLoadingAnalyzed(false);
        }
    };

    const handleAnalyze = async (owner: string, name: string) => {
        const key = `${owner}/${name}`;
        setAnalyzing(prev => new Set(prev).add(key));

        try {
            const result = await api.analyzeRepository(owner, name, user.id);
            console.log('Analysis started:', result);
            showSuccessMessage(`✅ Analysis started for ${owner}/${name}!\\n\\nThis will take a few minutes. Check the \"Analyzed Repository\" tab to see the status.`);
            await loadRepositories();
        } catch (error: any) {
            console.error('Analysis failed:', error);
            showErrorMessage(`Failed to analyze ${owner}/${name}`, error.message);
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
                showWarningMessage('Repository Not Analyzed', 'This repository has not been analyzed yet. Click "Analyze" first!');
                return;
            }

            if (status.status === 'ready') {
                window.location.href = `/repo/${status.repositoryId}`;
            } else if (status.status === 'analyzing') {
                showInfoMessage('Analysis in Progress', 'Analysis is still in progress. Please wait a few minutes and try again.');
            } else if (status.status === 'pending') {
                showInfoMessage('Analysis Queued', 'Analysis is queued and will start soon.');
            } else {
                showInfoMessage('Repository Status', `Current status: ${status.status}`);
            }
        } catch (error: any) {
            console.error('Failed to check status:', error);
            showErrorMessage('Status Check Failed', error.message);
        } finally {
            setCheckingStatus(prev => {
                const newSet = new Set(prev);
                newSet.delete(key);
                return newSet;
            });
        }
    };

    const handleAddRepository = async () => {
        if (!repoUrl.trim()) {
            setAddError('Please enter a GitHub repository URL');
            return;
        }

        setAddingRepo(true);
        setAddError('');
        setAddSuccess('');

        try {
            const result = await api.analyzeRepositoryByUrl(repoUrl.trim(), user.id);

            if (result.alreadyExists) {
                if (result.status === 'ready') {
                    showWarningMessage(
                        'Repository Already Analyzed',
                        `This repository has already been analyzed. You can view it in the "Analyzed Repository" tab.`
                    );
                    setActiveTab('analyzed');
                } else {
                    showInfoMessage(
                        'Analysis in Progress',
                        `This repository is already being analyzed. Check the "Analyzed Repository" tab for status updates.`
                    );
                    setActiveTab('analyzed');
                }
            } else {
                setAddSuccess(`✅ Successfully started analysis for the repository!\\n\\nAnalysis will take a few minutes. Switch to the "Analyzed Repository" tab to see the progress.`);
                setRepoUrl('');
                // Refresh analyzed repos
                if (activeTab !== 'analyzed') {
                    setTimeout(() => setActiveTab('analyzed'), 2000);
                }
            }
        } catch (error: any) {
            console.error('Failed to add repository:', error);
            setAddError(error.message || 'Failed to add repository');
        } finally {
            setAddingRepo(false);
        }
    };

    // Styled alert helpers
    const showSuccessMessage = (message: string) => {
        const formattedMessage = message.replace(/\\n\\n/g, '\\n');
        alert(formattedMessage);
    };

    const showErrorMessage = (title: string, message: string) => {
        alert(`❌ ${title}\\n\\n${message}`);
    };

    const showWarningMessage = (title: string, message: string) => {
        alert(`⚠️ ${title}\\n\\n${message}`);
    };

    const showInfoMessage = (title: string, message: string) => {
        alert(`ℹ️ ${title}\\n\\n${message}`);
    };

    // Render tabs navigation
    const renderTabs = () => (
        <div style={{
            borderBottom: '1px solid var(--color-border-primary)',
            marginBottom: 'var(--spacing-2xl)',
            display: 'flex',
            gap: 'var(--spacing-2xl)',
            position: 'relative'
        }}>
            <button
                onClick={() => setActiveTab('your')}
                className="btn-ghost"
                style={{
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'your' ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                    padding: 'var(--spacing-md) 0',
                    borderBottom: activeTab === 'your' ? '3px solid var(--color-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    transition: 'all var(--transition-base)',
                    position: 'relative'
                }}
            >
                <span style={{ marginRight: 'var(--spacing-sm)' }}>📦</span>
                <span>Your Repository</span>
            </button>
            <button
                onClick={() => setActiveTab('analyzed')}
                className="btn-ghost"
                style={{
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'analyzed' ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                    padding: 'var(--spacing-md) 0',
                    borderBottom: activeTab === 'analyzed' ? '3px solid var(--color-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    transition: 'all var(--transition-base)'
                }}
            >
                <span style={{ marginRight: 'var(--spacing-sm)' }}>📊</span>
                <span>Analyzed Repository</span>
            </button>
            <button
                onClick={() => setActiveTab('add')}
                className="btn-ghost"
                style={{
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'add' ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                    padding: 'var(--spacing-md) 0',
                    borderBottom: activeTab === 'add' ? '3px solid var(--color-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    transition: 'all var(--transition-base)'
                }}
            >
                <span style={{ marginRight: 'var(--spacing-sm)' }}>➕</span>
                <span>Add Repository</span>
            </button>
        </div>
    );

    // Render "Your Repository" tab
    const renderYourRepositoriesTab = () => {
        if (loading) {
            return (
                <div style={{ textAlign: 'center', paddingTop: 'var(--spacing-3xl)' }} className="animate-fadeIn">
                    <div style={{ fontSize: '80px', marginBottom: 'var(--spacing-xl)', animation: 'pulse 2s ease-in-out infinite' }}>⏳</div>
                    <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-md)' }}>Loading your repositories from GitHub...</h2>
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-base)' }}>This may take a few seconds</p>

                    {/* Loading Skeletons */}
                    <div className="repo-list" style={{ marginTop: 'var(--spacing-2xl)', maxWidth: '800px', margin: 'var(--spacing-2xl) auto 0' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="card" style={{ animation: `fadeIn 0.5s ease-out ${i * 0.1}s both` }}>
                                <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: 'var(--spacing-md)' }} />
                                <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: 'var(--spacing-sm)' }} />
                                <div className="skeleton" style={{ height: '16px', width: '40%' }} />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="animate-slideIn" style={{
                    padding: 'var(--spacing-xl)',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
                    border: '1px solid var(--color-error)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--color-error)',
                    marginTop: 'var(--spacing-xl)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-md)' }}>
                        ⚠️ Error
                    </div>
                    <div style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-lg)' }}>{error}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-primary)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
                        <strong style={{ display: 'block', marginBottom: 'var(--spacing-sm)' }}>Make sure:</strong>
                        <ul style={{ marginLeft: 'var(--spacing-xl)', lineHeight: 1.8 }}>
                            <li>The backend is running</li>
                            <li>Your GitHub access token is valid</li>
                            <li>You granted the required permissions to the GitHub App</li>
                        </ul>
                    </div>
                    <button
                        onClick={loadRepositories}
                        className="btn btn-secondary"
                        style={{ marginTop: 'var(--spacing-lg)' }}
                    >
                        🔄 Try Again
                    </button>
                </div>
            );
        }

        if (repos.length === 0) {
            return (
                <div style={{ textAlign: 'center', paddingTop: 'var(--spacing-2xl)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-sm)' }}>Welcome, {user.username}!</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-base)' }}>
                        No repositories found in your GitHub account.
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}>
                        Create a repository on GitHub to get started!
                    </p>
                </div>
            );
        }

        return (
            <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-lg)' }}>Your Repositories <span className="badge badge-primary" style={{ marginLeft: 'var(--spacing-sm)' }}>{repos.length}</span></h2>
                    <button
                        onClick={loadRepositories}
                        className="btn btn-secondary"
                    >
                        Refresh
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
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>
                                        {repo.description || 'No description'}
                                    </p>
                                    {isAnalyzed && (
                                        <div style={{ marginTop: 'var(--spacing-md)' }}>
                                            {status === 'ready' ? (
                                                <span className="badge badge-success">
                                                    Analysis Complete
                                                </span>
                                            ) : status === 'analyzing' ? (
                                                <span className="badge badge-warning">
                                                    Analyzing...
                                                </span>
                                            ) : status === 'pending' ? (
                                                <span className="badge badge-info">
                                                    Pending
                                                </span>
                                            ) : (
                                                <span style={{
                                                    color: 'var(--color-text-muted)',
                                                    fontSize: 'var(--font-size-xs)'
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
                                            className="btn btn-secondary"
                                            disabled
                                        >
                                            Starting...
                                        </button>
                                    ) : !isAnalyzed ? (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleAnalyze(repo.login, repo.name)}
                                        >
                                            Analyze
                                        </button>
                                    ) : isCheckingStatus ? (
                                        <button
                                            className="btn btn-secondary"
                                            disabled
                                        >
                                            Checking...
                                        </button>
                                    ) : status === 'ready' ? (
                                        <button
                                            className="btn"
                                            style={{ background: 'var(--color-primary)', color: 'white' }}
                                            onClick={() => handleViewAnalysis(repo.login, repo.name)}
                                        >
                                            View Analysis
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleViewAnalysis(repo.login, repo.name)}
                                        >
                                            {status === 'analyzing' ? 'Check Status' : 'Check Status'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{
                    marginTop: 'var(--spacing-xl)',
                    padding: 'var(--spacing-lg)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border-primary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                }}>
                    <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-sm)' }}>
                        How it works:
                    </div>
                    <ul style={{ marginLeft: 'var(--spacing-lg)', lineHeight: 1.6 }}>
                        <li>Repositories are fetched from your GitHub account</li>
                        <li>Click "Analyze" to clone and analyze a repository</li>
                        <li>Analysis includes: Git history parsing, semantic embeddings, and ownership calculation</li>
                        <li>Click "View Analysis" when ready to see detailed insights</li>
                        <li>Use "Refresh" to update repository statuses</li>
                    </ul>
                </div>
            </>
        );
    };

    // Render "Analyzed Repository" tab
    const renderAnalyzedRepositoriesTab = () => {
        return (
            <>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2>Analyzed Repositories</h2>
                        <button
                            onClick={loadAnalyzedRepositories}
                            className="btn"
                            style={{ background: '#21262d', fontSize: '14px' }}
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    {/* Filter buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setAnalyzedFilter('all')}
                            className="btn"
                            style={{
                                background: analyzedFilter === 'all' ? '#58a6ff' : '#21262d',
                                color: analyzedFilter === 'all' ? '#0d1117' : '#c9d1d9',
                                fontSize: '14px',
                                padding: '6px 12px'
                            }}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setAnalyzedFilter('your')}
                            className="btn"
                            style={{
                                background: analyzedFilter === 'your' ? '#58a6ff' : '#21262d',
                                color: analyzedFilter === 'your' ? '#0d1117' : '#c9d1d9',
                                fontSize: '14px',
                                padding: '6px 12px'
                            }}
                        >
                            Your
                        </button>
                        < button
                            onClick={() => setAnalyzedFilter('others')}
                            className="btn"
                            style={{
                                background: analyzedFilter === 'others' ? '#58a6ff' : '#21262d',
                                color: analyzedFilter === 'others' ? '#0d1117' : '#c9d1d9',
                                fontSize: '14px',
                                padding: '6px 12px'
                            }}
                        >
                            Others
                        </button>
                    </div>
                </div>

                {loadingAnalyzed ? (
                    <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                        <p style={{ color: '#8b949e' }}>Loading analyzed repositories...</p>
                    </div>
                ) : analyzedError ? (
                    <div style={{
                        padding: '20px',
                        background: '#da363320',
                        border: '1px solid #da3633',
                        borderRadius: '6px',
                        color: '#f85149'
                    }}>
                        <strong>⚠️ Error:</strong> {analyzedError}
                        <button
                            onClick={loadAnalyzedRepositories}
                            className="btn"
                            style={{ marginTop: '16px', background: '#21262d' }}
                        >
                            Try Again
                        </button>
                    </div>
                ) : analyzedRepos.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
                        <h2>No Analyzed Repositories</h2>
                        <p style={{ color: '#8b949e', marginTop: '20px', fontSize: '16px' }}>
                            {analyzedFilter === 'your'
                                ? 'You haven\'t analyzed any repositories yet.'
                                : analyzedFilter === 'others'
                                    ? 'No repositories from other users have been added.'
                                    : 'No repositories have been analyzed yet.'}
                        </p>
                        <p style={{ color: '#8b949e', marginTop: '12px', fontSize: '14px' }}>
                            {analyzedFilter === 'your'
                                ? 'Go to "Your Repository" tab and click "Analyze" on a repository.'
                                : 'Go to "Add Repository" tab to add a repository from another user.'}
                        </p>
                    </div>
                ) : (
                    <div className="repo-list">
                        {analyzedRepos.map((repo: any) => (
                            <div key={repo.id} className="card repo-card">
                                <div className="repo-info">
                                    <h3>{repo.ownerUsername}/{repo.name}</h3>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            background: repo.isMine ? '#238636' : '#1f6feb',
                                            color: 'white',
                                            fontWeight: 600
                                        }}>
                                            {repo.label}
                                        </span>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            background: repo.status === 'ready' ? '#238636' : repo.status === 'analyzing' ? '#f0883e' : '#8b949e',
                                            color: 'white'
                                        }}>
                                            {repo.status === 'ready' ? '✅ Ready' : repo.status === 'analyzing' ? '⏳ Analyzing' : repo.status}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        className="btn"
                                        style={{
                                            background: repo.status === 'ready' ? '#388bfd20' : '#21262d',
                                            color: repo.status === 'ready' ? '#58a6ff' : '#8b949e'
                                        }}
                                        onClick={() => {
                                            if (repo.status === 'ready') {
                                                window.location.href = `/repo/${repo.id}`;
                                            } else if (repo.status === 'analyzing') {
                                                showInfoMessage('Analysis in Progress', 'This repository is still being analyzed. Please check back in a few minutes.');
                                            } else {
                                                showInfoMessage('Repository Status', `Current status: ${repo.status}`);
                                            }
                                        }}
                                        disabled={repo.status !== 'ready'}
                                    >
                                        {repo.status === 'ready' ? '📊 View Details' : repo.status === 'analyzing' ? '⏳ Analyzing...' : '⏸️ Pending'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    // Render "Add Repository" tab
    const renderAddRepositoryTab = () => {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>➕</div>
                    <h2>Add Repository to Analyze</h2>
                    <p style={{ color: '#8b949e', marginTop: '12px', fontSize: '14px' }}>
                        Add any public GitHub repository to analyze, even if the owner hasn't logged in to this platform.
                    </p>
                </div>

                <div style={{
                    padding: '24px',
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px'
                }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                        GitHub Repository URL
                    </label>
                    <input
                        type="text"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/owner/repo"
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#0d1117',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            color: '#c9d1d9',
                            fontSize: '14px',
                            marginBottom: '16px'
                        }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !addingRepo) {
                                handleAddRepository();
                            }
                        }}
                    />

                    <button
                        onClick={handleAddRepository}
                        disabled={addingRepo || !repoUrl.trim()}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '16px',
                            fontWeight: 600,
                            opacity: addingRepo || !repoUrl.trim() ? 0.5 : 1,
                            cursor: addingRepo || !repoUrl.trim() ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {addingRepo ? '⏳ Analyzing...' : '🔍 Analyze Repository'}
                    </button>

                    {addError && (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            background: '#da363320',
                            border: '1px solid #da3633',
                            borderRadius: '6px',
                            color: '#f85149',
                            fontSize: '14px'
                        }}>
                            <strong>❌ Error:</strong> {addError}
                        </div>
                    )}

                    {addSuccess && (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            background: '#23863620',
                            border: '1px solid #238636',
                            borderRadius: '6px',
                            color: '#3fb950',
                            fontSize: '14px',
                            whiteSpace: 'pre-line'
                        }}>
                            {addSuccess}
                        </div>
                    )}
                </div>

                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: '#1f6feb20',
                    border: '1px solid #1f6feb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#8b949e'
                }}>
                    <strong style={{ color: '#58a6ff' }}>ℹ️ Supported URL Formats:</strong>
                    <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                        <li><code>https://github.com/owner/repo</code></li>
                        <li><code>https://github.com/owner/repo.git</code></li>
                        <li><code>github.com/owner/repo</code></li>
                        <li><code>owner/repo</code></li>
                    </ul>
                    <p style={{ marginTop: '12px', fontSize: '12px' }}>
                        <strong>Note:</strong> Only public repositories can be analyzed. Private repositories require the owner to log in.
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="container">
            <h1 style={{ marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-xl)' }}>Repository Management</h1>

            {renderTabs()}

            {activeTab === 'your' && renderYourRepositoriesTab()}
            {activeTab === 'analyzed' && renderAnalyzedRepositoriesTab()}
            {activeTab === 'add' && renderAddRepositoryTab()}
        </div>
    );
}
