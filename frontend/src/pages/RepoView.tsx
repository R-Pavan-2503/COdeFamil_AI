import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import FileTree from '../components/FileTree';
import BackButton from '../components/BackButton';
import RepositoryAnalytics from '../components/RepositoryAnalytics';
import TeamInsights from '../components/TeamInsights';

interface RepoViewProps {
    user: any;
}

export default function RepoView({ user }: RepoViewProps) {
    const { repositoryId } = useParams<{ repositoryId: string }>();
    const [activeTab, setActiveTab] = useState<'commits' | 'prs' | 'files' | 'analytics'>('commits');
    const [repository, setRepository] = useState<any>(null);
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('main');
    const [commits, setCommits] = useState<any[]>([]);
    const [prs, setPrs] = useState<any[]>([]);
    const [allPrs, setAllPrs] = useState<any[]>([]);
    const [prFilter, setPrFilter] = useState<'all' | 'open' | 'closed'>('all');
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Helper to reload all data
    const loadRepoData = async () => {
        await loadRepository();
        await loadBranches();
        await loadCommits();
        await loadPRs();
        await loadFiles();
    };

    useEffect(() => {
        loadRepository();
        loadBranches();
    }, [repositoryId]);

    useEffect(() => {
        if (activeTab === 'commits') loadCommits();
        else if (activeTab === 'prs') loadPRs();
        else if (activeTab === 'files') loadFiles();
    }, [activeTab, selectedBranch]);

    useEffect(() => {
        if (allPrs.length > 0) {
            if (prFilter === 'all') {
                setPrs(allPrs);
            } else if (prFilter === 'open') {
                setPrs(allPrs.filter((pr: any) => pr.state === 'open'));
            } else if (prFilter === 'closed') {
                setPrs(allPrs.filter((pr: any) => pr.state === 'closed'));
            }
        }
    }, [prFilter, allPrs]);

    const loadRepository = async () => {
        try {
            const data = await api.getRepository(repositoryId!);
            setRepository(data);
        } catch (error) {
            console.error('Failed to load repository:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBranches = async () => {
        try {
            const data = await fetch(`http://localhost:5000/api/repositories/${repositoryId}/branches`);
            const branches = await data.json();
            setBranches(branches);

            // Set default branch
            const defaultBranch = branches.find((b: any) => b.isDefault);
            if (defaultBranch) {
                setSelectedBranch(defaultBranch.name);
            }
        } catch (error) {
            console.error('Failed to load branches:', error);
        }
    };

    const loadCommits = async () => {
        try {
            // Load commits filtered by selected branch
            const data = await fetch(`http://localhost:5000/api/repositories/${repositoryId}/branches/${selectedBranch}/commits`);
            const commits = await data.json();
            setCommits(commits);
        } catch (error) {
            console.error('Failed to load commits:', error);
        }
    };

    const loadPRs = async () => {
        try {
            const data = await api.getPullRequests(repositoryId!);
            setAllPrs(data);
            setPrs(data);
        } catch (error) {
            console.error('Failed to load PRs:', error);
        }
    };

    const loadFiles = async () => {
        try {
            // Load files filtered by selected branch
            const data = await fetch(`http://localhost:5000/api/repositories/${repositoryId}/branches/${selectedBranch}/files`);
            const files = await data.json();
            setFiles(files);
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    };

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null);

    // Auto-refresh on load if stale (> 1 hour)
    useEffect(() => {
        if (repository?.lastRefreshAt) {
            setLastRefreshTime(repository.lastRefreshAt);
            const lastRefresh = new Date(repository.lastRefreshAt);
            const now = new Date();
            const diffHours = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);

            if (diffHours > 1) {
                console.log("Repository is stale, triggering auto-refresh...");
                refreshRepository();
            }
        }
    }, [repository]);

    // Poll for updates when refreshing
    useEffect(() => {
        let interval: any;
        if (isRefreshing && repository) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`http://localhost:5000/repositories/${repositoryId}`);
                    const data = await res.json();

                    // Check if timestamp updated
                    if (data.lastRefreshAt !== lastRefreshTime) {
                        setRepository(data);
                        setLastRefreshTime(data.lastRefreshAt);
                        setIsRefreshing(false);
                        // Re-fetch commits and files to show new data
                        loadRepoData();
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 3000); // Poll every 3 seconds
        }
        return () => clearInterval(interval);
    }, [isRefreshing, lastRefreshTime, repositoryId]);

    const refreshRepository = async () => {
        if (isRefreshing || !repositoryId) return;

        setIsRefreshing(true);
        try {
            await fetch(`http://localhost:5000/repositories/${repositoryId}/refresh`, {
                method: 'POST'
            });
            // Don't set isRefreshing(false) here - wait for polling to detect the change
        } catch (err) {
            console.error("Failed to trigger refresh:", err);
            setIsRefreshing(false);
            alert("Failed to start refresh");
        }
    };

    if (loading) {
        return <div className="container">Loading repository...</div>;
    }

    if (!repository) {
        return <div className="container">Repository not found</div>;
    }

    return (
        <div className="container">
            <BackButton to="/" label="Back to Dashboard" />

            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1>{repository.ownerUsername}/{repository.name}</h1>
                            <button
                                onClick={refreshRepository}
                                disabled={isRefreshing}
                                style={{
                                    background: isRefreshing ? '#30363d' : '#21262d',
                                    border: '1px solid #30363d',
                                    color: isRefreshing ? '#8b949e' : '#c9d1d9',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: isRefreshing ? 'default' : 'pointer',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isRefreshing ? (
                                    <>
                                        <span className="animate-spin">↻</span> Refreshing...
                                    </>
                                ) : (
                                    <>
                                        <span>↻</span> Refresh
                                    </>
                                )}
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                            <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                background: repository.status === 'ready' ? '#238636' : '#f0883e',
                                color: 'white'
                            }}>
                                {repository.status || 'unknown'}
                            </span>
                            {repository.lastRefreshAt && (
                                <span style={{ fontSize: '12px', color: '#8b949e' }}>
                                    Last updated: {new Date(repository.lastRefreshAt).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Branch Selector */}
                    {branches.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#8b949e', fontSize: '14px' }}>Branch:</span>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                style={{
                                    background: '#21262d',
                                    color: '#c9d1d9',
                                    border: '1px solid #30363d',
                                    padding: '8px 32px 8px 12px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {branches.map((branch: any) => (
                                    <option key={branch.id} value={branch.name}>
                                        {branch.name} {branch.isDefault && '(default)'}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={refreshRepository}
                                disabled={isRefreshing}
                                style={{
                                    background: '#21262d',
                                    color: '#c9d1d9',
                                    border: '1px solid #30363d',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginLeft: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isRefreshing) e.currentTarget.style.background = '#30363d';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isRefreshing) e.currentTarget.style.background = '#21262d';
                                }}
                            >
                                <span style={{
                                    display: 'inline-block',
                                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                                }}>↻</span>
                                {isRefreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <style>{`
                                @keyframes spin {
                                    from { transform: rotate(0deg); }
                                    to { transform: rotate(360deg); }
                                }
                            `}</style>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                borderBottom: '1px solid #30363d',
                marginBottom: '24px',
                display: 'flex',
                gap: '24px'
            }}>
                <button
                    onClick={() => setActiveTab('commits')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'commits' ? '#58a6ff' : '#8b949e',
                        padding: '8px 0',
                        borderBottom: activeTab === 'commits' ? '2px solid #58a6ff' : 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                    }}
                >
                    Commits
                </button>
                <button
                    onClick={() => setActiveTab('prs')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'prs' ? '#58a6ff' : '#8b949e',
                        padding: '8px 0',
                        borderBottom: activeTab === 'prs' ? '2px solid #58a6ff' : 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                    }}
                >
                    Pull Requests ({allPrs.length})
                </button>
                <button
                    onClick={() => setActiveTab('files')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'files' ? '#58a6ff' : '#8b949e',
                        padding: '8px 0',
                        borderBottom: activeTab === 'files' ? '2px solid #58a6ff' : 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                    }}
                >
                    File Structure
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'analytics' ? '#58a6ff' : '#8b949e',
                        padding: '8px 0',
                        borderBottom: activeTab === 'analytics' ? '2px solid #58a6ff' : 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                    }}
                >
                    📊 Analytics
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'commits' && (
                <div>
                    <h2>Commits from branch: {selectedBranch}</h2>
                    {commits.length === 0 ? (
                        <p>No commits found</p>
                    ) : (
                        <div className="repo-list">
                            {commits.map((commit: any) => (
                                <div key={commit.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <code style={{ color: '#58a6ff', fontSize: '12px' }}>
                                                {commit.sha.substring(0, 7)}
                                            </code>
                                            <p style={{ margin: '8px 0', color: '#c9d1d9' }}>
                                                {commit.message}
                                            </p>
                                            <span style={{ fontSize: '12px', color: '#8b949e' }}>
                                                {new Date(commit.committedAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            style={{
                                                background: '#58a6ff',
                                                color: '#0d1117',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                            onClick={() => window.location.href = `/commit/${commit.id}`}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#388bfd';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(88, 166, 255, 0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#58a6ff';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <span>View Details</span>
                                            <span>→</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'prs' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2>Pull Requests ({prs.length})</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setPrFilter('all')}
                                style={{
                                    background: prFilter === 'all' ? '#58a6ff' : '#21262d',
                                    color: prFilter === 'all' ? '#0d1117' : '#c9d1d9',
                                    fontSize: '14px',
                                    padding: '6px 12px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setPrFilter('open')}
                                style={{
                                    background: prFilter === 'open' ? '#58a6ff' : '#21262d',
                                    color: prFilter === 'open' ? '#0d1117' : '#c9d1d9',
                                    fontSize: '14px',
                                    padding: '6px 12px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Open
                            </button>
                            <button
                                onClick={() => setPrFilter('closed')}
                                style={{
                                    background: prFilter === 'closed' ? '#58a6ff' : '#21262d',
                                    color: prFilter === 'closed' ? '#0d1117' : '#c9d1d9',
                                    fontSize: '14px',
                                    padding: '6px 12px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Closed
                            </button>
                        </div>
                    </div>
                    {prs.length === 0 ? (
                        <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔀</div>
                            <h3>No Pull Requests Found</h3>
                            <p style={{ color: '#8b949e', marginTop: '12px' }}>
                                {prFilter === 'all'
                                    ? 'No pull requests have been created for this repository yet.'
                                    : `No ${prFilter} pull requests found.`}
                            </p>
                        </div>
                    ) : (
                        <div className="repo-list">
                            {prs.map((pr: any) => (
                                <div key={pr.id} className="card repo-card">
                                    <div className="repo-info" style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{
                                                background: '#6e7681',
                                                color: 'white',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                fontWeight: 600
                                            }}>PR</span>
                                            <h3>{pr.title || `Pull Request #${pr.prNumber}`}</h3>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                                            <span style={{ color: '#8b949e', fontSize: '14px', fontFamily: 'monospace' }}>#{pr.prNumber}</span>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                background: pr.state === 'open' ? '#238636' : '#8250df',
                                                color: 'white',
                                                fontWeight: 600
                                            }}>
                                                {pr.state === 'open' ? 'Open' : 'Merged'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{
                                            background: '#58a6ff',
                                            color: '#0d1117',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            marginLeft: '16px'
                                        }}
                                        onClick={() => window.location.href = `/pr/${repository.ownerUsername}/${repository.name}/${pr.prNumber}`}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#388bfd';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(88, 166, 255, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#58a6ff';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <span>View PR</span>
                                        <span>→</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div >
            )}

            {
                activeTab === 'files' && (
                    <div>
                        <h2>File Structure ({selectedBranch} branch)</h2>
                        {files.length === 0 ? (
                            <p>No files found</p>
                        ) : (
                            <div className="card" style={{
                                padding: '16px',
                                background: '#161b22',
                                border: '1px solid #30363d',
                                borderRadius: '8px'
                            }}>
                                <FileTree
                                    files={files}
                                    onFileClick={(fileId) => window.location.href = `/file/${fileId}?branch=${encodeURIComponent(selectedBranch)}`}
                                />
                            </div>
                        )}
                    </div>
                )
            }

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div>
                    <h2>Repository Analytics</h2>
                    <RepositoryAnalytics repositoryId={repositoryId!} />

                    <h2 style={{ marginTop: '48px' }}>Team Insights</h2>
                    <TeamInsights repositoryId={repositoryId!} />
                </div>
            )}
        </div >
    );
}
