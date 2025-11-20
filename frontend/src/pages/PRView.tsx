import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function PRView() {
    const { prId } = useParams<{ prId: string }>();
    const [pr, setPr] = useState<any>(null);
    const [files, setFiles] = useState<any[]>([]);
    const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPR();
    }, [prId]);

    const loadPR = async () => {
        try {
            const response = await fetch(`http://localhost:5000/pullrequests/${prId}`);
            const data = await response.json();
            setPr(data.pr);
            setFiles(data.files || []);

            // Mock risk analysis - in real app this would come from backend
            setRiskAnalysis({
                riskScore: 0.65,
                structuralOverlap: 0.4,
                semanticOverlap: 0.8,
                conflictingPrs: [
                    { prNumber: 123, risk: 0.65, conflictingFiles: ['src/auth.ts', 'src/api.ts'] }
                ]
            });
        } catch (error) {
            console.error('Failed to load PR:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="container">Loading pull request...</div>;
    }

    if (!pr) {
        return <div className="container">Pull request not found</div>;
    }

    const getRiskColor = (risk: number) => {
        if (risk >= 0.8) return '#f85149';
        if (risk >= 0.5) return '#d29922';
        return '#3fb950';
    };

    const getRiskLabel = (risk: number) => {
        if (risk >= 0.8) return 'HIGH RISK';
        if (risk >= 0.5) return 'MEDIUM RISK';
        return 'LOW RISK';
    };

    return (
        <div className="container">
            <div style={{ marginBottom: '24px' }}>
                <h1>Pull Request #{pr.prNumber}</h1>

                <div className="card" style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    background: pr.state === 'open' ? '#238636' : '#8b949e',
                                    color: 'white'
                                }}>
                                    {pr.state?.toUpperCase()}
                                </span>
                            </div>
                            <p style={{ fontSize: '12px', color: '#8b949e' }}>
                                Author: {pr.authorId || 'Unknown'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Risk Analysis */}
            {riskAnalysis && (
                <div style={{ marginBottom: '24px' }}>
                    <h2>Conflict Risk Analysis</h2>
                    <div className="card" style={{
                        background: getRiskColor(riskAnalysis.riskScore) + '20',
                        borderColor: getRiskColor(riskAnalysis.riskScore)
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, color: getRiskColor(riskAnalysis.riskScore) }}>
                                {getRiskLabel(riskAnalysis.riskScore)}
                            </h3>
                            <div style={{
                                fontSize: '32px',
                                fontWeight: 'bold',
                                color: getRiskColor(riskAnalysis.riskScore)
                            }}>
                                {(riskAnalysis.riskScore * 100).toFixed(0)}%
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>
                                    Structural Overlap
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 600 }}>
                                    {(riskAnalysis.structuralOverlap * 100).toFixed(0)}%
                                </div>
                                <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>
                                    Same files/regions being modified
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>
                                    Semantic Overlap
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 600 }}>
                                    {(riskAnalysis.semanticOverlap * 100).toFixed(0)}%
                                </div>
                                <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>
                                    Similar code intent (AI analysis)
                                </div>
                            </div>
                        </div>

                        {riskAnalysis.conflictingPrs.length > 0 && (
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #30363d' }}>
                                <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Conflicting PRs:</h4>
                                {riskAnalysis.conflictingPrs.map((conflict: any, index: number) => (
                                    <div key={index} style={{
                                        padding: '12px',
                                        background: '#161b22',
                                        borderRadius: '6px',
                                        marginBottom: '8px',
                                        border: '1px solid #30363d'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <strong>PR #{conflict.prNumber}</strong>
                                                <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>
                                                    Conflicting files: {conflict.conflictingFiles.join(', ')}
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                background: getRiskColor(conflict.risk),
                                                color: 'white'
                                            }}>
                                                {(conflict.risk * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {riskAnalysis.riskScore >= 0.8 && (
                            <div style={{
                                marginTop: '16px',
                                padding: '12px',
                                background: '#da363320',
                                border: '1px solid #da3633',
                                borderRadius: '6px'
                            }}>
                                <strong style={{ color: '#f85149' }}>⚠️ Merge Blocked</strong>
                                <p style={{ fontSize: '12px', margin: '8px 0 0 0', color: '#c9d1d9' }}>
                                    This PR has been automatically blocked due to high conflict risk.
                                    Please resolve conflicts with the listed PRs before merging.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Changed Files */}
            <div>
                <h2>Changed Files ({files.length})</h2>
                {files.length === 0 ? (
                    <p>No files changed</p>
                ) : (
                    <div className="repo-list">
                        {files.map((file: any) => (
                            <div key={file.id} className="card">
                                <code style={{ color: '#58a6ff' }}>{file.filePath}</code>
                                {file.totalLines && (
                                    <span style={{ marginLeft: '12px', fontSize: '12px', color: '#8b949e' }}>
                                        {file.totalLines} lines
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
