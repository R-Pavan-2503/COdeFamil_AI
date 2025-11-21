import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import DependencyGraph from '../components/DependencyGraph';
import BackButton from '../components/BackButton';
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

            // Get file content
            try {
                const contentResponse = await fetch(`http://localhost:5000/files/${fileId}/content`);
                if (contentResponse.ok) {
                    const contentData = await contentResponse.json();
                    setContent(contentData.content);
                } else {
                    setContent('// Failed to load file content');
                }
            } catch (e) {
                console.error('Failed to fetch content:', e);
                setContent('// Failed to load file content');
            }

        } catch (err: any) {
            console.error('Failed to load file:', err);
            setError(err.message || 'Failed to load file');
        } finally {
            setLoading(false);
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

                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                        <button className="btn" style={{ background: '#21262d' }}>
                            ← Previous Commit
                        </button>
                        <button className="btn" style={{ background: '#21262d' }}>
                            Next Commit →
                        </button>
                    </div>

                    <div style={{
                        marginTop: '24px',
                        padding: '16px',
                        background: '#161b22',
                        border: '1px solid #30363d',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#8b949e'
                    }}>
                        💡 <strong>Note:</strong> Code navigation through commits will be fully functional once commit history integration is complete.
                    </div>
                </div>
            )}

            {/* File Analysis Tab */}
            {activeTab === 'analysis' && analysis && (
                <div>
                    {/* File Purpose */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <h3>📝 File Purpose</h3>
                        <p style={{ color: '#8b949e', marginTop: '8px' }}>
                            {analysis.purpose || 'Semantic summary will be generated from embeddings'}
                        </p>
                    </div>

                    {/* Ownership */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <h3>👥 Code Ownership</h3>
                        {analysis.owners && analysis.owners.length > 0 ? (
                            <div style={{ marginTop: '12px' }}>
                                {analysis.owners.map((owner: any, idx: number) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '8px 0',
                                        borderBottom: idx < analysis.owners.length - 1 ? '1px solid #30363d' : 'none'
                                    }}>
                                        <span>{owner.username}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '100px',
                                                height: '8px',
                                                background: '#21262d',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${owner.semanticScore}%`,
                                                    height: '100%',
                                                    background: '#3fb950'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '14px', color: '#3fb950', fontWeight: 600 }}>
                                                {owner.semanticScore}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#8b949e', marginTop: '8px' }}>
                                Ownership data will be populated after multi-author analysis
                            </p>
                        )}
                    </div>

                    {/* Dependencies Graph */}
                    <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
                        <h3>🔀 Dependency Graph</h3>
                        <p style={{ color: '#8b949e', fontSize: '13px', marginTop: '4px', marginBottom: '16px' }}>
                            Interactive visualization of file dependencies and dependents
                        </p>

                        {((analysis.dependencies && analysis.dependencies.length > 0) ||
                            (analysis.dependents && analysis.dependents.length > 0)) ? (
                            <DependencyGraph
                                currentFile={{
                                    id: fileId!,
                                    filePath: file.filePath
                                }}
                                dependencies={analysis.dependencies || []}
                                dependents={analysis.dependents || []}
                            />
                        ) : (
                            <div style={{
                                padding: '40px',
                                textAlign: 'center',
                                background: '#0d1117',
                                borderRadius: '8px',
                                border: '1px solid #30363d'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                                <p style={{ color: '#8b949e', marginTop: '8px' }}>
                                    No dependencies or dependents found for this file
                                </p>
                            </div>
                        )}

                        {/* Blast Radius Warning */}
                        {analysis.dependents && analysis.dependents.length > 0 && (
                            <div style={{
                                marginTop: '16px',
                                padding: '12px',
                                background: '#f0883e20',
                                border: '1px solid #f0883e',
                                borderRadius: '6px',
                                fontSize: '13px'
                            }}>
                                ⚠️ <strong>Blast Radius:</strong> Changes to this file will affect {analysis.dependents.length} other file(s)
                            </div>
                        )}
                    </div>

                    {/* Semantic Neighbors */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <h3>🧠 Semantically Similar Files</h3>
                        <p style={{ color: '#8b949e', fontSize: '13px', marginTop: '4px', marginBottom: '12px' }}>
                            Files with similar code patterns (based on AI embeddings)
                        </p>
                        {analysis.semanticNeighbors && analysis.semanticNeighbors.length > 0 ? (
                            <div style={{ marginTop: '12px' }}>
                                {analysis.semanticNeighbors.map((file: any, idx: number) => (
                                    <div key={idx} style={{
                                        padding: '8px 12px',
                                        background: '#0d1117',
                                        borderRadius: '6px',
                                        marginBottom: '8px'
                                    }}>
                                        <code style={{ color: '#58a6ff', fontSize: '13px' }}>
                                            {file.filePath}
                                        </code>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#8b949e', marginTop: '8px' }}>
                                Calculating semantic similarities...
                            </p>
                        )}
                    </div>

                    {/* Change History */}
                    <div className="card">
                        <h3>📈 Change History</h3>
                        <div style={{ marginTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                <span style={{ color: '#8b949e' }}>Total Changes:</span>
                                <span style={{ fontWeight: 600 }}>{analysis.changeCount || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #30363d' }}>
                                <span style={{ color: '#8b949e' }}>Most Active Author:</span>
                                <span style={{ fontWeight: 600 }}>{analysis.mostFrequentAuthor || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #30363d' }}>
                                <span style={{ color: '#8b949e' }}>Last Modified:</span>
                                <span style={{ fontWeight: 600 }}>
                                    {analysis.lastModified ? new Date(analysis.lastModified).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            {analysis.isInOpenPr && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    background: '#d2992220',
                                    border: '1px solid #d29922',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    color: '#d29922'
                                }}>
                                    ⓘ This file is part of an open Pull Request
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
