import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function CommitView() {
    const { commitId } = useParams<{ commitId: string }>();
    const [commit, setCommit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

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

            // Get GitHub details
            try {
                const githubResponse = await fetch(`http://localhost:5000/commits/${commitId}/github-details`);
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
                    <h2 style={{ marginBottom: '16px' }}>Changed Files</h2>
                    {commit.github.files.map((file: any, idx: number) => (
                        <div key={idx} className="card" style={{ marginBottom: '16px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '12px',
                                paddingBottom: '12px',
                                borderBottom: '1px solid #30363d'
                            }}>
                                <h3 style={{ fontSize: '16px', color: '#58a6ff' }}>{file.filename}</h3>
                                <span style={{
                                    fontSize: '12px',
                                    color: file.status === 'added' ? '#3fb950' : file.status === 'removed' ? '#f85149' : '#d29922'
                                }}>
                                    {file.status.toUpperCase()}
                                </span>
                            </div>
                            {file.patch && (
                                <pre style={{
                                    background: '#0d1117',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    overflowX: 'auto',
                                    fontSize: '12px',
                                    color: '#c9d1d9'
                                }}>
                                    {file.patch}
                                </pre>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
