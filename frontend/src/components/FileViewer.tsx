import { useState } from 'react';

interface FileViewerProps {
    file: any;
}

export default function FileViewer({ file }: FileViewerProps) {
    const [currentCommitIndex, setCurrentCommitIndex] = useState(0);
    const [fileContent, setFileContent] = useState('// File content will load here...\n// Use Prev/Next to navigate through commits');

    const navigateToPrevCommit = () => {
        if (currentCommitIndex > 0) {
            setCurrentCommitIndex(currentCommitIndex - 1);
            // In real implementation, fetch file content at previous commit
            loadFileAtCommit(currentCommitIndex - 1);
        }
    };

    const navigateToNextCommit = () => {
        setCurrentCommitIndex(currentCommitIndex + 1);
        // In real implementation, fetch file content at next commit
        loadFileAtCommit(currentCommitIndex + 1);
    };

    const loadFileAtCommit = async (commitIndex: number) => {
        // This would call the API to get file content at specific commit
        // For now, just update the placeholder
        setFileContent(`// File content at commit ${commitIndex}\n// This would show the actual file content from that commit`);
    };

    return (
        <div>
            {/* Navigation Controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                padding: '12px',
                background: '#161b22',
                borderRadius: '6px',
                border: '1px solid #30363d'
            }}>
                <div style={{ fontSize: '14px', color: '#8b949e' }}>
                    Commit Navigation
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={navigateToPrevCommit}
                        disabled={currentCommitIndex === 0}
                        className="btn"
                        style={{
                            background: '#21262d',
                            opacity: currentCommitIndex === 0 ? 0.5 : 1,
                            cursor: currentCommitIndex === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ← Prev
                    </button>
                    <span style={{
                        padding: '8px 16px',
                        background: '#0d1117',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        Commit {currentCommitIndex + 1}
                    </span>
                    <button
                        onClick={navigateToNextCommit}
                        className="btn"
                        style={{ background: '#21262d' }}
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* Code Display */}
            <div className="card">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #30363d'
                }}>
                    <h3 style={{ margin: 0, fontSize: '14px' }}>{file.filePath}</h3>
                    <span style={{ fontSize: '12px', color: '#8b949e' }}>
                        {file.totalLines || 0} lines
                    </span>
                </div>

                <pre style={{
                    background: '#0d1117',
                    padding: '16px',
                    borderRadius: '6px',
                    overflow: 'auto',
                    maxHeight: '600px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    border: '1px solid #30363d',
                    margin: 0,
                    fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace'
                }}>
                    <code style={{ color: '#c9d1d9' }}>{fileContent}</code>
                </pre>
            </div>

            {/* File Info */}
            <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#161b22',
                borderRadius: '6px',
                border: '1px solid #30363d',
                fontSize: '12px',
                color: '#8b949e'
            }}>
                <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#c9d1d9' }}>How to use:</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Use "Prev" and "Next" buttons to navigate through commit history</li>
                    <li>See how the file evolved over time</li>
                    <li>Compare different versions to understand changes</li>
                </ul>
            </div>
        </div>
    );
}
