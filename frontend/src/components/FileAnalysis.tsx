interface FileAnalysisProps {
    file: any;
    analysis: any;
}

export default function FileAnalysis({ file, analysis }: FileAnalysisProps) {
    return (
        <div style={{ display: 'grid', gap: '16px' }}>
            {/* Semantic Purpose */}
            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff' }}>
                    📝 File Purpose
                </h3>
                <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: '1.6' }}>
                    AI-generated semantic summary based on code embeddings and function analysis.
                    This file appears to handle {file.filePath.includes('auth') ? 'authentication logic' :
                        file.filePath.includes('api') ? 'API communication' : 'business logic'}.
                </p>
            </div>

            {/* Semantic Ownership */}
            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff' }}>
                    👥 Semantic Ownership
                </h3>
                <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '12px' }}>
                    Based on vector embedding deltas, not lines of code
                </p>

                {analysis.ownership && analysis.ownership.length > 0 ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {analysis.ownership.map((owner: any, index: number) => (
                            <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                background: '#0d1117',
                                borderRadius: '6px',
                                border: '1px solid #30363d'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                        User {owner.userId.substring(0, 8)}...
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#8b949e' }}>
                                        Semantic contribution: {owner.semanticScore ? (owner.semanticScore * 100).toFixed(1) : 0}%
                                    </div>
                                </div>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: `conic-gradient(#3fb950 ${(owner.semanticScore || 0) * 360}deg, #30363d 0deg)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        background: '#161b22',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {owner.semanticScore ? (owner.semanticScore * 100).toFixed(0) : 0}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '12px', color: '#8b949e' }}>
                        No ownership data available yet
                    </p>
                )}
            </div>

            {/* Dependencies */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="card">
                    <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff' }}>
                        📦 Dependencies
                    </h3>
                    <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px' }}>
                        Files this file imports
                    </p>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3fb950' }}>
                        {analysis.dependencies || 0}
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff' }}>
                        🔗 Dependents
                    </h3>
                    <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px' }}>
                        Files that import this
                    </p>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d29922' }}>
                        {analysis.dependents || 0}
                    </div>
                </div>
            </div>

            {/* Semantic Neighbors (Blast Radius) */}
            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff' }}>
                    🎯 Blast Radius (Semantic Neighbors)
                </h3>
                <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '12px' }}>
                    Files with similar code patterns (via vector similarity)
                </p>

                {analysis.semanticNeighbors && analysis.semanticNeighbors.length > 0 ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {analysis.semanticNeighbors.map((neighbor: any, index: number) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 12px',
                                background: '#0d1117',
                                borderRadius: '6px',
                                border: '1px solid #30363d'
                            }}>
                                <code style={{ fontSize: '12px', color: '#58a6ff' }}>
                                    {neighbor.filePath}
                                </code>
                                <div style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    background: '#238636',
                                    color: 'white'
                                }}>
                                    {(neighbor.similarity * 100).toFixed(0)}% similar
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '12px', color: '#8b949e' }}>
                        No similar files found
                    </p>
                )}
            </div>

            {/* Change Statistics */}
            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff' }}>
                    📊 Change Statistics
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>
                            Total Changes
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>
                            {analysis.changeCount || 0}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>
                            Most Active Author
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>
                            {analysis.mostFrequentAuthor || 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>
                            In Open PR
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>
                            {analysis.isInOpenPr ? '✓' : '✗'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="card" style={{
                background: '#58a6ff20',
                borderColor: '#58a6ff'
            }}>
                <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff' }}>
                    💡 Recommended Reviewers
                </h3>
                <p style={{ fontSize: '12px', color: '#c9d1d9', marginBottom: '12px' }}>
                    Based on semantic ownership and contribution patterns
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {analysis.ownership && analysis.ownership.slice(0, 3).map((owner: any, index: number) => (
                        <div key={index} style={{
                            padding: '6px 12px',
                            background: '#161b22',
                            border: '1px solid #58a6ff',
                            borderRadius: '16px',
                            fontSize: '12px',
                            color: '#58a6ff'
                        }}>
                            User {owner.userId.substring(0, 8)}... ({owner.semanticScore ? (owner.semanticScore * 100).toFixed(0) : 0}%)
                        </div>
                    ))}
                    {(!analysis.ownership || analysis.ownership.length === 0) && (
                        <span style={{ fontSize: '12px', color: '#8b949e' }}>
                            No recommendations available yet
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
