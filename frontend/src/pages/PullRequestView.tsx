import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import BackButton from '../components/BackButton';

interface PullRequestViewProps {
    user: any;
}

export default function PullRequestView({ user }: PullRequestViewProps) {
    const { owner, repo, prNumber } = useParams<{ owner: string; repo: string; prNumber: string }>();
    const [prDetails, setPrDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadPRDetails();
    }, [owner, repo, prNumber]);

    const loadPRDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const data = await api.getPullRequestDetails(owner!, repo!, parseInt(prNumber!), token || undefined);
            setPrDetails(data);
        } catch (err: any) {
            console.error('Failed to load PR details:', err);
            setError(err.message || 'Failed to load PR details');
        } finally {
            setLoading(false);
        }
    };

    const toggleFile = (filename: string) => {
        const newExpanded = new Set(expandedFiles);
        if (newExpanded.has(filename)) {
            newExpanded.delete(filename);
        } else {
            newExpanded.add(filename);
        }
        setExpandedFiles(newExpanded);
    };

    const getStatusIcon = (status: string) => {
        // Emojis removed as per request
        return null;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'added': return '#238636';
            case 'removed': return '#da3633';
            case 'modified': return '#d29922';
            default: return '#8b949e';
        }
    };

    if (loading) {
        return <div className="container">Loading PR details...</div>;
    }

    if (error) {
        return (
            <div className="container">
                <button
                    onClick={() => window.history.back()}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#58a6ff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    ← Back
                </button>
                <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
                    <h3>Failed to Load PR Details</h3>
                    <p style={{ color: '#8b949e', marginTop: '12px' }}>{error}</p>
                </div>
            </div>
        );
    }

    if (!prDetails) {
        return <div className="container">PR not found</div>;
    }

    return (
        <div className="container">
            <button
                onClick={() => window.history.back()}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#58a6ff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            >
                ← Back
            </button>

            {/* PR Header */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h1 style={{ margin: 0 }}>PR #{prDetails.number}</h1>
                    <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: prDetails.state === 'open' ? '#238636' : prDetails.merged ? '#8957e5' : '#8b949e',
                        color: 'white',
                        fontWeight: 600
                    }}>
                        {prDetails.state === 'open' ? '🟢 Open' : prDetails.merged ? '🟣 Merged' : '⚫ Closed'}
                    </span>
                </div>
                <h2 style={{ color: '#c9d1d9', fontWeight: 400, marginTop: '8px' }}>{prDetails.title}</h2>
            </div>

            {/* Author */}
            <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                        src={prDetails.author.avatarUrl}
                        alt={prDetails.author.login}
                        style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                    />
                    <div>
                        <div style={{ fontWeight: 600, color: '#c9d1d9' }}>{prDetails.author.login}</div>
                        <div style={{ fontSize: '12px', color: '#8b949e' }}>Author</div>
                    </div>
                </div>
            </div>

            {/* Branches */}
            <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', color: '#8b949e' }}>Branches</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'monospace' }}>
                    <span style={{
                        padding: '4px 8px',
                        background: '#21262d',
                        borderRadius: '6px',
                        color: '#58a6ff'
                    }}>
                        {prDetails.headBranch}
                    </span>
                    <span style={{ color: '#8b949e' }}>→</span>
                    <span style={{
                        padding: '4px 8px',
                        background: '#21262d',
                        borderRadius: '6px',
                        color: '#58a6ff'
                    }}>
                        {prDetails.baseBranch}
                    </span>
                </div>
            </div>

            {/* Description */}
            {prDetails.body && (
                <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', color: '#8b949e' }}>Description</h3>
                    <div style={{
                        color: '#c9d1d9',
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.6'
                    }}>
                        {prDetails.body}
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', color: '#8b949e' }}>Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8b949e' }}>Created:</span>
                        <span style={{ color: '#c9d1d9' }}>{new Date(prDetails.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8b949e' }}>Updated:</span>
                        <span style={{ color: '#c9d1d9' }}>{new Date(prDetails.updatedAt).toLocaleString()}</span>
                    </div>
                    {prDetails.mergedAt && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#8b949e' }}>Merged:</span>
                            <span style={{ color: '#c9d1d9' }}>{new Date(prDetails.mergedAt).toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ✨ NEW: Recommended Reviewers */}
            {prDetails.recommendedReviewers && prDetails.recommendedReviewers.length > 0 && (
                <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '16px', color: '#c9d1d9' }}>
                        🎯 Recommended Reviewers
                    </h3>
                    <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '16px' }}>
                        Based on file ownership across all changed files
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {prDetails.recommendedReviewers.map((reviewer: any, idx: number) => (
                            <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                background: '#0d1117',
                                borderRadius: '8px',
                                border: '1px solid #30363d'
                            }}>
                                {reviewer.avatarUrl ? (
                                    <img
                                        src={reviewer.avatarUrl}
                                        alt={reviewer.authorName}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            border: '2px solid #3fb950'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: '#3fb950',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: 'white'
                                    }}>
                                        {reviewer.authorName?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: '#c9d1d9', marginBottom: '4px' }}>
                                        {reviewer.authorName}
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: '#21262d',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${reviewer.percentage}%`,
                                            height: '100%',
                                            background: '#3fb950',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3fb950' }}>
                                        {reviewer.percentage.toFixed(1)}%
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#8b949e' }}>
                                        {reviewer.filesContributed} {reviewer.filesContributed === 1 ? 'file' : 'files'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ✨ NEW: Potential Merge Conflicts */}
            <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '16px', color: '#c9d1d9' }}>
                    ⚠️ Potential Merge Conflicts
                </h3>
                {prDetails.potentialConflicts && prDetails.potentialConflicts.length > 0 ? (
                    <>
                        <p style={{ fontSize: '12px', color: '#f85149', marginBottom: '16px' }}>
                            Found {prDetails.potentialConflicts.length} {prDetails.potentialConflicts.length === 1 ? 'PR' : 'PRs'} with overlapping files
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {prDetails.potentialConflicts.map((conflict: any, idx: number) => (
                                <div key={idx} style={{
                                    padding: '12px',
                                    background: '#da363320',
                                    borderRadius: '8px',
                                    border: '1px solid #f85149'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <strong style={{ color: '#c9d1d9' }}>PR #{conflict.prNumber}</strong>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                background: '#f85149',
                                                color: 'white',
                                                fontWeight: 600
                                            }}>
                                                {conflict.conflictPercentage.toFixed(0)}% overlap
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#8b949e', marginBottom: '8px' }}>
                                        {conflict.title}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#c9d1d9' }}>
                                        <strong>Overlapping files:</strong>
                                        <div style={{
                                            marginTop: '6px',
                                            padding: '8px',
                                            background: '#0d1117',
                                            borderRadius: '6px',
                                            fontFamily: 'monospace'
                                        }}>
                                            {conflict.overlappingFiles.map((file: string, fileIdx: number) => (
                                                <div key={fileIdx} style={{ padding: '2px 0', color: '#f85149' }}>
                                                    • {file}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '32px',
                        color: '#3fb950'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>
                            No conflicts detected with other open PRs
                        </div>
                    </div>
                )}
            </div>

            {/* Files Changed */}
            <div>
                <h2 style={{ marginBottom: '16px' }}>Files Changed ({prDetails.filesChanged.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {prDetails.filesChanged.map((file: any) => (
                        <div key={file.filename} className="card" style={{ padding: '16px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                                onClick={() => toggleFile(file.filename)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {/* Emoji removed */}
                                    <code style={{ color: '#c9d1d9', fontSize: '14px' }}>{file.filename}</code>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        background: getStatusColor(file.status),
                                        color: 'white'
                                    }}>
                                        {file.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <span style={{ color: '#238636', fontSize: '12px' }}>+{file.additions}</span>
                                    <span style={{ color: '#da3633', fontSize: '12px' }}>-{file.deletions}</span>
                                    <span style={{ fontSize: '12px', color: '#8b949e' }}>
                                        {expandedFiles.has(file.filename) ? '▼' : '▶'}
                                    </span>
                                </div>
                            </div>

                            {expandedFiles.has(file.filename) && file.patch && (
                                <div style={{
                                    marginTop: '12px',
                                    background: '#0d1117',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    border: '1px solid #30363d'
                                }}>
                                    {file.patch.split('\n').map((line: string, lineIdx: number) => {
                                        // Determine line type and styling
                                        let bgColor = 'transparent';
                                        let textColor = '#c9d1d9';
                                        let borderLeft = 'none';

                                        if (line.startsWith('+') && !line.startsWith('+++')) {
                                            bgColor = '#23863620';
                                            textColor = '#3fb950';
                                            borderLeft = '3px solid #3fb950';
                                        } else if (line.startsWith('-') && !line.startsWith('---')) {
                                            bgColor = '#da363320';
                                            textColor = '#f85149';
                                            borderLeft = '3px solid #f85149';
                                        } else if (line.startsWith('@@')) {
                                            bgColor = '#388bfd20';
                                            textColor = '#58a6ff';
                                            borderLeft = '3px solid #58a6ff';
                                        } else if (line.startsWith('+++') || line.startsWith('---')) {
                                            textColor = '#8b949e';
                                        }

                                        return (
                                            <div
                                                key={lineIdx}
                                                style={{
                                                    padding: '2px 12px',
                                                    background: bgColor,
                                                    color: textColor,
                                                    fontFamily: 'monospace',
                                                    fontSize: '12px',
                                                    lineHeight: '20px',
                                                    borderLeft: borderLeft,
                                                    whiteSpace: 'pre',
                                                    overflowX: 'auto'
                                                }}
                                            >
                                                {line || ' '}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
