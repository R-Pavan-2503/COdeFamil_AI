import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';

export default function CommitView() {
    const { commitId } = useParams<{ commitId: string }>();
    const [commit, setCommit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadCommit();
    }, [commitId]);

    const loadCommit = async () => {
        try {
            setLoading(true);
            setError('');

            // Get commit from database
            const response = await fetch(`http://localhost:5000/commits/${commitId}`);
            if (!response.ok) throw new Error('Commit not found');

            const dbCommit = await response.json();
            setCommit(dbCommit);

            // Try to get GitHub details with user token
            try {
                const token = localStorage.getItem('token');
                const headers: any = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                const githubResponse = await fetch(`http://localhost:5000/commits/${commitId}/github-details`, { headers });
                if (githubResponse.ok) {
                    const githubData = await githubResponse.json();
                    setCommit((prev: any) => ({ ...prev, github: githubData }));
                }
            } catch (e) {
                console.error('Failed to fetch GitHub details:', e);
            }

        } catch (err: any) {
            console.error('Failed to load commit:', err);
            setError(err.message || 'Failed to load commit');
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

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <h2>Loading commit details...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div style={{
                    padding: '20px',
                    background: '#da363320',
                    border: '1px solid #da3633',
                    borderRadius: '6px',
                    color: '#f85149'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            </div>
        );
    }

    if (!commit) {
        return <div className="container">Commit not found</div>;
    }

    return (
        <div className="container">
            <BackButton />

            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <code style={{
                        fontSize: '20px',
                        color: '#58a6ff',
                        background: '#0d1117',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #30363d'
                    }}>
                        {commit.sha ? commit.sha.substring(0, 7) : 'Unknown'}
                    </code>
                    <span style={{ color: '#8b949e', fontSize: '14px' }}>
                        {commit.committedAt && new Date(commit.committedAt).toLocaleString()}
                    </span>
                </div>

                <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
                    {commit.message || 'No message'}
                </h1>

                {commit.github && (
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '14px' }}>
                        <span style={{ color: '#3fb950' }}>+{commit.github.stats?.additions || 0} additions</span>
                        <span style={{ color: '#f85149' }}>-{commit.github.stats?.deletions || 0} deletions</span>
                        <span style={{ color: '#8b949e' }}>{commit.github.files?.length || 0} files changed</span>
                    </div>
                )}
            </div>

            <div className="card">
                <h2>Commit Information</h2>
                <div style={{ marginTop: '16px' }}>
                    <div style={{ padding: '8px 0', borderBottom: '1px solid #30363d' }}>
                        <span style={{ color: '#8b949e' }}>SHA:</span> <code style={{ color: '#58a6ff', marginLeft: '8px' }}>{commit.sha}</code>
                    </div>
                    <div style={{ padding: '8px 0', borderBottom: '1px solid #30363d' }}>
                        <span style={{ color: '#8b949e' }}>Message:</span> <span style={{ marginLeft: '8px' }}>{commit.message}</span>
                    </div>
                    <div style={{ padding: '8px 0', borderBottom: '1px solid #30363d' }}>
                        <span style={{ color: '#8b949e' }}>Author:</span> <span style={{ marginLeft: '8px' }}>{commit.github?.commit?.author?.name || 'Unknown'}</span>
                    </div>
                    <div style={{ padding: '8px 0' }}>
                        <span style={{ color: '#8b949e' }}>Date:</span> <span style={{ marginLeft: '8px' }}>{commit.committedAt && new Date(commit.committedAt).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {commit.github?.files && (
                <div style={{ marginTop: '24px' }}>
                    <h2 style={{ marginBottom: '16px' }}>Files Changed ({commit.github.files.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {commit.github.files.map((file: any, idx: number) => (
                            <div key={idx} className="card" style={{ padding: '16px' }}>
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
                                        <code style={{ color: '#c9d1d9', fontSize: '14px' }}>{file.filename}</code>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            background: file.status === 'added' ? '#238636' : file.status === 'removed' ? '#da3633' : '#d29922',
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
            )}
        </div>
    );
}
