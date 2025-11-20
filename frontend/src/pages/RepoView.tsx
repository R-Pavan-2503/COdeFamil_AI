import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';

interface RepoViewProps {
    user: any;
}

export default function RepoView({ user }: RepoViewProps) {
    const { repositoryId } = useParams<{ repositoryId: string }>();
    const [activeTab, setActiveTab] = useState<'commits' | 'prs' | 'files'>('commits');
    const [repository, setRepository] = useState<any>(null);
    const [commits, setCommits] = useState<any[]>([]);
    const [prs, setPrs] = useState<any[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRepository();
    }, [repositoryId]);

    useEffect(() => {
        if (activeTab === 'commits') loadCommits();
        else if (activeTab === 'prs') loadPRs();
        else if (activeTab === 'files') loadFiles();
    }, [activeTab]);

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

    const loadCommits = async () => {
        try {
            const data = await api.getCommits(repositoryId!);
            setCommits(data);
        } catch (error) {
            console.error('Failed to load commits:', error);
        }
    };

    const loadPRs = async () => {
        try {
            // API endpoint would be similar
            setPrs([]);
        } catch (error) {
            console.error('Failed to load PRs:', error);
        }
    };

    const loadFiles = async () => {
        try {
            const data = await api.getFiles(repositoryId!);
            setFiles(data);
        } catch (error) {
            console.error('Failed to load files:', error);
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
            <div style={{ marginBottom: '24px' }}>
                <h1>{repository.ownerUsername}/{repository.name}</h1>
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
                    Pull Requests
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
            </div>

            {/* Tab Content */}
            {activeTab === 'commits' && (
                <div>
                    <h2>Commits</h2>
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
                                            className="btn"
                                            style={{ background: '#21262d' }}
                                            onClick={() => window.location.href = `/commit/${commit.id}`}
                                        >
                                            View Details
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
                    <h2>Pull Requests</h2>
                    {prs.length === 0 ? (
                        <p>No pull requests found</p>
                    ) : (
                        <div className="repo-list">
                            {prs.map((pr: any) => (
                                <div key={pr.id} className="card">
                                    <div>
                                        <h3>#{pr.prNumber} - {pr.title}</h3>
                                        <p>State: {pr.state}</p>
                                        {pr.riskScore && (
                                            <div style={{
                                                marginTop: '8px',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                background: pr.riskScore >= 0.8 ? '#da3633' : pr.riskScore >= 0.5 ? '#d29922' : '#238636',
                                                color: 'white',
                                                fontSize: '12px',
                                                display: 'inline-block'
                                            }}>
                                                Risk: {(pr.riskScore * 100).toFixed(0)}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'files' && (
                <div>
                    <h2>File Structure</h2>
                    {files.length === 0 ? (
                        <p>No files found</p>
                    ) : (
                        <div className="repo-list">
                            {files.map((file: any) => (
                                <div key={file.id} className="card" style={{
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                    onClick={() => window.location.href = `/file/${file.id}`}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#1c2128'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#161b22'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <code style={{ color: '#58a6ff' }}>{file.filePath}</code>
                                            {file.totalLines && (
                                                <span style={{ marginLeft: '12px', fontSize: '12px', color: '#8b949e' }}>
                                                    {file.totalLines} lines
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ color: '#8b949e', fontSize: '12px' }}>→</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
