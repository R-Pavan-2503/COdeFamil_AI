import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import DependencyGraph from '../components/DependencyGraph';
import BackButton from '../components/BackButton';
import FileAnalysis from '../components/FileAnalysis';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


export default function FileView() {
    const { fileId } = useParams<{ fileId: string }>();
    const [file, setFile] = useState<any>(null);
    const [content, setContent] = useState<string>('');
    const [analysis, setAnalysis] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'code' | 'analysis'>('code');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    const [commitHistory, setCommitHistory] = useState<any[]>([]);
    const [currentCommitSha, setCurrentCommitSha] = useState<string | null>(null);

    // Helper function to get language from file path
    const getLanguageFromPath = (filePath: string): string => {
        const extension = filePath.split('.').pop()?.toLowerCase();
        const languageMap: { [key: string]: string } = {
            'js': 'javascript',
            'jsx': 'jsx',
            'ts': 'typescript',
            'tsx': 'tsx',
            'py': 'python',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'rb': 'ruby',
            'php': 'php',
            'swift': 'swift',
            'kt': 'kotlin',
            'dart': 'dart',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'sql': 'sql',
            'sh': 'bash',
            'bash': 'bash',
        };
        return languageMap[extension || ''] || 'javascript';
    };

    useEffect(() => {
        loadFile();
    }, [fileId]);

    const loadFile = async () => {
        try {
            setLoading(true);
            setError('');

            // Get file metadata
            const fileData = await fetch(`http://localhost:5000/files/${fileId}`);
            if (!fileData.ok) throw new Error('File not found');

            const file = await fileData.json();
            setFile(file);

            // Get file analysis
            const analysisData = await api.getFileAnalysis(fileId!);
            setAnalysis(analysisData);

            // Load commit history
            try {
                const historyRes = await fetch(`http://localhost:5000/files/${fileId}/commits`);
                if (historyRes.ok) {
                    const history = await historyRes.json();
                    setCommitHistory(history);
                    // Default to latest commit (first in list) if no specific SHA requested
                    if (history.length > 0 && !currentCommitSha) {
                        setCurrentCommitSha(history[0].sha);
                    }
                }
            } catch (e) {
                console.error('Failed to load history:', e);
            }

            // Get file content - include branch parameter if present in URL
            await fetchContent();

        } catch (err: any) {
            console.error('Failed to load file:', err);
            setError(err.message || 'Failed to load file');
        } finally {
            setLoading(false);
        }
    };

    const fetchContent = async (sha?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams(window.location.search);
            const branch = params.get('branch');

            let contentUrl = `http://localhost:5000/files/${fileId}/content`;

            if (sha) {
                contentUrl += `?commitSha=${sha}`;
            } else if (branch) {
                contentUrl += `?branchName=${encodeURIComponent(branch)}`;
            }

            const contentResponse = await fetch(contentUrl);
            if (contentResponse.ok) {
                const contentData = await contentResponse.json();
                setContent(contentData.content);
                if (contentData.commitSha) {
                    setCurrentCommitSha(contentData.commitSha);
                }
            } else {
                setContent('// Failed to load file content');
            }
        } catch (e) {
            console.error('Failed to fetch content:', e);
            setContent('// Failed to load file content');
        } finally {
            setLoading(false);
        }
    };

    const handlePreviousCommit = () => {
        if (!commitHistory.length) return;
        const currentIndex = currentCommitSha ? commitHistory.findIndex(c => c.sha === currentCommitSha) : -1;

        if (currentIndex === -1) {
            // If current commit is not in history (likely newer), go to the latest known commit (index 0)
            fetchContent(commitHistory[0].sha);
        } else if (currentIndex < commitHistory.length - 1) {
            const prevCommit = commitHistory[currentIndex + 1]; // Older commit
            fetchContent(prevCommit.sha);
        }
    };

    const handleNextCommit = () => {
        if (!commitHistory.length || !currentCommitSha) return;
        const currentIndex = commitHistory.findIndex(c => c.sha === currentCommitSha);
        if (currentIndex > 0) {
            const nextCommit = commitHistory[currentIndex - 1]; // Newer commit
            fetchContent(nextCommit.sha);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <h2>Loading file...</h2>
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

    if (!file) {
        return <div className="container">File not found</div>;
    }

    const currentIndex = currentCommitSha ? commitHistory.findIndex(c => c.sha === currentCommitSha) : -1;
    // Allow previous if we are at a known index < length-1 OR if we are at an unknown index (assuming it's newer)
    const canGoPrevious = (currentIndex !== -1 && currentIndex < commitHistory.length - 1) || (currentIndex === -1 && commitHistory.length > 0);
    const canGoNext = currentIndex !== -1 && currentIndex > 0;

    return (
        <div className="container">
            <BackButton />

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1>{file?.filePath || 'Unknown file'}</h1>
                {file?.totalLines && (
                    <span style={{ color: '#8b949e', fontSize: '14px' }}>
                        {file.totalLines} lines
                    </span>
                )}
                {currentCommitSha && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#8b949e', fontFamily: 'monospace' }}>
                        <span style={{ color: '#fff' }}>{currentCommitSha.substring(0, 7)}</span>
                        {commitHistory.find(c => c.sha === currentCommitSha) && (
                            <span style={{ marginLeft: '12px' }}>
                                {commitHistory.find(c => c.sha === currentCommitSha)?.message}
                                <span style={{ color: '#8b949e', marginLeft: '8px' }}>
                                    • {new Date(commitHistory.find(c => c.sha === currentCommitSha)?.committedAt || '').toLocaleDateString()}
                                </span>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={{
                borderBottom: '1px solid #30363d',
                marginBottom: '24px',
                display: 'flex',
                gap: '24px'
            }}>
                <button
                    onClick={() => setActiveTab('code')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'code' ? '#58a6ff' : '#8b949e',
                        padding: '8px 0',
                        borderBottom: activeTab === 'code' ? '2px solid #58a6ff' : 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                    }}
                >
                    💻 Code View
                </button>
                <button
                    onClick={() => setActiveTab('analysis')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'analysis' ? '#58a6ff' : '#8b949e',
                        padding: '8px 0',
                        borderBottom: activeTab === 'analysis' ? '2px solid #58a6ff' : 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                    }}
                >
                    📊 File Analysis
                </button>
            </div>

            {/* Code View Tab */}
            {activeTab === 'code' && (
                <div>
                    <SyntaxHighlighter
                        language={getLanguageFromPath(file?.filePath || '')}
                        style={vscDarkPlus}
                        showLineNumbers={true}
                        wrapLines={true}
                        customStyle={{
                            background: '#0d1117',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            padding: '16px',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            margin: 0,
                        }}
                        lineNumberStyle={{
                            minWidth: '3em',
                            paddingRight: '1em',
                            color: '#6e7681',
                            userSelect: 'none',
                        }}
                    >
                        {content}
                    </SyntaxHighlighter>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            className="btn"
                            style={{
                                background: canGoPrevious ? '#21262d' : '#161b22',
                                color: canGoPrevious ? '#c9d1d9' : '#484f58',
                                cursor: canGoPrevious ? 'pointer' : 'not-allowed',
                                border: '1px solid #30363d'
                            }}
                            onClick={handlePreviousCommit}
                            disabled={!canGoPrevious}
                        >
                            ← Previous Commit
                        </button>
                        <button
                            className="btn"
                            style={{
                                background: canGoNext ? '#21262d' : '#161b22',
                                color: canGoNext ? '#c9d1d9' : '#484f58',
                                cursor: canGoNext ? 'pointer' : 'not-allowed',
                                border: '1px solid #30363d'
                            }}
                            onClick={handleNextCommit}
                            disabled={!canGoNext}
                        >
                            Next Commit →
                        </button>
                        {commitHistory.length > 0 && (
                            <span style={{ fontSize: '12px', color: '#8b949e', marginLeft: '8px' }}>
                                {currentIndex !== -1
                                    ? `(Commit ${commitHistory.length - currentIndex} of ${commitHistory.length})`
                                    : '(Latest Unindexed Commit)'}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* File Analysis Tab */}
            {activeTab === 'analysis' && analysis && (
                <FileAnalysis file={file} analysis={analysis} />
            )}
        </div>
    );
}
