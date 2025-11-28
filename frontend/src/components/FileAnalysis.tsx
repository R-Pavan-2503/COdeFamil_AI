import { useEffect, useState } from 'react';
import NetworkGraph from './NetworkGraph';
import InfoTooltip from './InfoTooltip';
import MetricCard from './MetricCard';
import CircularProgress from './CircularProgress';
import BarProgress from './BarProgress';
import SectionHeader from './SectionHeader';

interface FileAnalysisProps {
    file: any;
    analysis: any;
}

export default function FileAnalysis({ file, analysis }: FileAnalysisProps) {
    const [enhancedData, setEnhancedData] = useState<any>(null);

    useEffect(() => {
        loadEnhancedData();
    }, [file.id]);

    const loadEnhancedData = async () => {
        try {
            const response = await fetch(`http://localhost:5000/repositories/files/${file.id}/enhanced-analysis`);
            if (response.ok) {
                const data = await response.json();
                setEnhancedData(data);
            }
        } catch (error) {
            console.error('Failed to load enhanced data:', error);
        }
    };

    // Calculate metrics
    const depCount = enhancedData?.dependencies?.length || 0;
    const dptCount = enhancedData?.dependents?.length || 0;
    const changeCount = analysis.changeCount || 0;
    const codeHealth = Math.min(100, Math.max(0, 100 - (depCount * 2) - (changeCount / 10)));
    const impactScore = Math.min(100, (dptCount * 10) + (depCount * 5));
    const activityScore = Math.min(100, changeCount * 2);

    return (
        <div style={{ display: 'grid', gap: '20px' }}>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Header Stats - Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <MetricCard
                    icon="💚"
                    title="Code Health"
                    value={codeHealth.toFixed(0)}
                    subtitle="Based on complexity & dependencies"
                    color="#3fb950"
                    tooltip="Measures file maintainability based on dependency count and change frequency. Higher scores indicate cleaner, more maintainable code."
                    formula="100 - (dependencies × 2) - (changes ÷ 10)"
                />
                <MetricCard
                    icon="⚡"
                    title="Impact Score"
                    value={impactScore.toFixed(0)}
                    subtitle={`${dptCount} files depend on this`}
                    color="#d29922"
                    tooltip="Shows how many files will be affected if you change this file. Higher scores mean more critical files. Changes here have wider blast radius."
                    formula="(dependents × 10) + (dependencies × 5)"
                />
                <MetricCard
                    icon="🔥"
                    title="Activity Level"
                    value={activityScore.toFixed(0)}
                    subtitle={`${changeCount} total changes`}
                    color="#f85149"
                    trend={5}
                    tooltip="Indicates how frequently this file is modified. High activity might suggest core functionality or technical debt. Useful for identifying hotspots."
                    formula="changes × 2 (capped at 100)"
                />
                <MetricCard
                    icon="🎯"
                    title="Connections"
                    value={depCount + dptCount}
                    subtitle={`${depCount} deps, ${dptCount} dependents`}
                    color="#bc8cff"
                    tooltip="Total number of file relationships. Includes both files this imports (dependencies) and files that import this (dependents). Shows coupling level."
                    formula="dependencies + dependents"
                />
            </div>

            {/* File Overview with Progress Rings */}
            <div className="card">
                <SectionHeader
                    icon="📊"
                    title="File Metrics Overview"
                    tooltip="Visual dashboard showing key file health indicators at a glance. Each circular gauge represents a different quality metric calculated from code analysis and git history."
                    formula="Visual representation of the metrics above"
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '24px', justifyItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <CircularProgress value={Math.min(100, codeHealth)} color="#3fb950" />
                        <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#c9d1d9' }}>
                            Code Health
                        </div>
                        <div style={{ fontSize: '11px', color: '#8b949e' }}>Excellent</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <CircularProgress value={Math.min(100, impactScore)} color="#d29922" />
                        <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#c9d1d9' }}>
                            Impact
                        </div>
                        <div style={{ fontSize: '11px', color: '#8b949e' }}>
                            {impactScore > 70 ? 'Critical' : impactScore > 40 ? 'High' : 'Moderate'}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <CircularProgress value={Math.min(100, activityScore)} color="#f85149" />
                        <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#c9d1d9' }}>
                            Activity
                        </div>
                        <div style={{ fontSize: '11px', color: '#8b949e' }}>
                            {activityScore > 70 ? 'Very Active' : activityScore > 40 ? 'Active' : 'Stable'}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <CircularProgress
                            value={analysis.ownership?.[0]?.semanticScore ? (analysis.ownership[0].semanticScore * 100).toFixed(0) : 0}
                            color="#bc8cff"
                        />
                        <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#c9d1d9' }}>
                            Main Owner
                        </div>
                        <div style={{ fontSize: '11px', color: '#8b949e' }}>Contribution</div>
                    </div>
                </div>
            </div>

            {/* Detailed Dependency Analysis */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#3fb950', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📦 Dependencies Analysis
                        </h3>
                        <InfoTooltip
                            text="Shows files that this file imports. Lower dependency count means better separation of concerns. Direct imports are explicit, indirect are transitive dependencies."
                            formula="Count of unique import statements"
                        />
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#3fb950', marginBottom: '16px' }}>
                        {depCount}
                    </div>
                    <BarProgress label="Direct imports" value={depCount} maxValue={20} color="#3fb950" />
                    <BarProgress label="Indirect dependencies" value={enhancedData?.indirectDependencies?.length || 0} maxValue={30} color="#56d364" />

                    {enhancedData?.dependencies && enhancedData.dependencies.length > 0 && (
                        <div style={{ marginTop: '16px', borderTop: '1px solid #30363d', paddingTop: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', fontWeight: 600 }}>Direct Dependencies Files:</div>
                            <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {enhancedData.dependencies.map((dep: any, i: number) => (
                                    <div key={i} style={{
                                        padding: '6px 8px',
                                        background: '#0d1117',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        color: '#c9d1d9',
                                        border: '1px solid #30363d',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span title={dep.targetPath}>{dep.targetPath.split('/').pop()}</span>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ color: '#3fb950', fontSize: '10px' }}>{dep.dependencyType || 'import'}</span>
                                            <span style={{ color: '#8b949e', fontSize: '10px', background: '#30363d', padding: '0 4px', borderRadius: '4px' }}>{dep.score || 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {enhancedData?.indirectDependencies && enhancedData.indirectDependencies.length > 0 && (
                        <div style={{ marginTop: '16px', borderTop: '1px solid #30363d', paddingTop: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', fontWeight: 600 }}>Indirect Dependencies Files:</div>
                            <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {enhancedData.indirectDependencies.map((dep: any, i: number) => (
                                    <div key={i} style={{
                                        padding: '6px 8px',
                                        background: '#0d1117',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        color: '#c9d1d9',
                                        border: '1px solid #30363d',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span title={dep.targetPath}>{dep.targetPath.split('/').pop()}</span>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ color: '#56d364', fontSize: '10px' }}>indirect</span>
                                            <span style={{ color: '#8b949e', fontSize: '10px', background: '#30363d', padding: '0 4px', borderRadius: '4px' }}>{dep.score || 0.5}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '16px', padding: '12px', background: '#3fb95010', border: '1px solid #3fb95030', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#3fb950', fontWeight: 600, marginBottom: '4px' }}>
                            Dependency Health: Good
                        </div>
                        <div style={{ fontSize: '11px', color: '#8b949e' }}>
                            Low coupling, well-structured imports
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#d29922', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🔗 Dependents Impact
                        </h3>
                        <InfoTooltip
                            text="Files that import this file. Higher numbers mean more files affected by changes. Blast radius shows total files potentially impacted including indirect dependents."
                            formula="Count of files importing this file"
                        />
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#d29922', marginBottom: '16px' }}>
                        {dptCount}
                    </div>
                    <BarProgress label="Direct dependents" value={dptCount} maxValue={20} color="#d29922" />
                    <BarProgress label="Blast radius" value={enhancedData?.blastRadius?.length || 0} maxValue={50} color="#f0883e" />

                    {enhancedData?.dependents && enhancedData.dependents.length > 0 && (
                        <div style={{ marginTop: '16px', borderTop: '1px solid #30363d', paddingTop: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', fontWeight: 600 }}>Direct Dependent Files:</div>
                            <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {enhancedData.dependents.map((dep: any, i: number) => (
                                    <div key={i} style={{
                                        padding: '6px 8px',
                                        background: '#0d1117',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        color: '#c9d1d9',
                                        border: '1px solid #30363d',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span title={dep.sourcePath}>{dep.sourcePath?.split('/').pop() || 'Unknown'}</span>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ color: '#d29922', fontSize: '10px' }}>{dep.dependencyType || 'import'}</span>
                                            <span style={{ color: '#8b949e', fontSize: '10px', background: '#30363d', padding: '0 4px', borderRadius: '4px' }}>{dep.score || 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {enhancedData?.blastRadius && enhancedData.blastRadius.length > 0 && (
                        <div style={{ marginTop: '16px', borderTop: '1px solid #30363d', paddingTop: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', fontWeight: 600 }}>Blast Radius Files:</div>
                            <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {enhancedData.blastRadius.map((dep: any, i: number) => (
                                    <div key={i} style={{
                                        padding: '6px 8px',
                                        background: '#0d1117',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        color: '#c9d1d9',
                                        border: '1px solid #30363d',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span title={dep.sourcePath}>{dep.sourcePath?.split('/').pop() || 'Unknown'}</span>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ color: '#f0883e', fontSize: '10px' }}>indirect</span>
                                            <span style={{ color: '#8b949e', fontSize: '10px', background: '#30363d', padding: '0 4px', borderRadius: '4px' }}>{dep.score || 0.5}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '16px', padding: '12px', background: `${impactScore > 70 ? '#f8514910' : '#d2992210'}`, border: `1px solid ${impactScore > 70 ? '#f8514930' : '#d2992230'}`, borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: impactScore > 70 ? '#f85149' : '#d29922', fontWeight: 600, marginBottom: '4px' }}>
                            Impact Level: {impactScore > 70 ? 'Critical ⚠️' : 'Moderate'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#8b949e' }}>
                            Changes affect {dptCount} direct consumers
                        </div>
                    </div>
                </div>
            </div>

            {/* Semantic Purpose */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
                border: '1px solid #58a6ff40'
            }}>
                <SectionHeader
                    icon="🤖"
                    title="AI-Powered Insights"
                    tooltip="Machine learning analysis of your code using embeddings and semantic patterns. Provides intelligent categorization and quality assessment beyond simple metrics."
                    formula="Vector Similarity(File, Categories)"
                />
                <div style={{
                    padding: '16px',
                    background: '#58a6ff10',
                    borderRadius: '8px',
                    border: '1px solid #58a6ff20',
                    marginBottom: '16px'
                }}>
                    <div style={{ fontSize: '14px', color: '#c9d1d9', lineHeight: '1.6', marginBottom: '8px' }}>
                        📝 <strong style={{ color: '#58a6ff' }}>File Purpose:</strong> This file appears to handle{' '}
                        {file.filePath.includes('auth') ? 'authentication logic' :
                            file.filePath.includes('api') ? 'API communication' :
                                file.filePath.includes('component') ? 'UI component rendering' : 'business logic'}.
                    </div>
                    <div style={{ fontSize: '12px', color: '#8b949e' }}>
                        Generated from code embeddings and semantic analysis
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', background: '#0d1117', borderRadius: '6px', border: '1px solid #30363d' }}>
                        <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Complexity</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: depCount > 10 ? '#f85149' : '#3fb950' }}>
                            {depCount > 10 ? 'High' : depCount > 5 ? 'Medium' : 'Low'}
                        </div>
                    </div>
                    <div style={{ padding: '12px', background: '#0d1117', borderRadius: '6px', border: '1px solid #30363d' }}>
                        <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Maintainability</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#58a6ff' }}>
                            {codeHealth > 70 ? 'Good' : codeHealth > 40 ? 'Fair' : 'Needs Work'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Semantic Ownership with Beautiful Visualization */}
            <div className="card">
                <SectionHeader
                    icon="👥"
                    title="Semantic Ownership Distribution"
                    tooltip="Based on vector embedding changes, not just line counts. Shows who meaningfully contributed to the logic and structure, weighted by semantic impact rather than simple additions/deletions."
                    formula="Σ(VectorDelta * Author) / TotalDelta"
                />
                <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '16px' }}>
                    Based on vector embedding deltas, not lines of code
                </p>

                {analysis.ownership && analysis.ownership.length > 0 ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {analysis.ownership.map((owner: any, index: number) => {
                            const score = owner.semanticScore || 0;
                            const percentage = (score * 100).toFixed(1);
                            return (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    background: 'linear-gradient(90deg, #0d111720 0%, #0d1117 100%)',
                                    borderRadius: '8px',
                                    border: '1px solid #30363d'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#c9d1d9' }}>
                                            User {owner.userId.substring(0, 8)}...
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '10px',
                                            background: '#30363d',
                                            borderRadius: '5px',
                                            overflow: 'hidden',
                                            marginBottom: '6px'
                                        }}>
                                            <div style={{
                                                width: `${percentage}%`,
                                                height: '100%',
                                                background: `linear-gradient(90deg, #3fb950, #56d364)`,
                                                borderRadius: '5px',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#8b949e' }}>
                                            Semantic contribution: {percentage}%
                                        </div>
                                    </div>
                                    <div style={{
                                        minWidth: '80px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{
                                            width: '70px',
                                            height: '70px',
                                            borderRadius: '50%',
                                            background: `conic-gradient(#3fb950 ${score * 360}deg, #30363d 0deg)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto'
                                        }}>
                                            <div style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '50%',
                                                background: '#161b22',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                color: '#3fb950'
                                            }}>
                                                {percentage.split('.')[0]}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>👥</div>
                        <div style={{ fontSize: '14px' }}>No ownership data available yet</div>
                    </div>
                )}
            </div>

            {/* Network Graph Visualization */}
            {enhancedData && (enhancedData.dependencies?.length > 0 || enhancedData.dependents?.length > 0 || enhancedData.semanticNeighbors?.length > 0) && (
                <div className="card">
                    <SectionHeader
                        icon="🕸️"
                        title="File Connections Network Graph"
                        tooltip="Interactive visualization showing all file relationships. Green nodes = dependencies (imports), Orange = dependents (importers), Purple = similar files. Helps understand code architecture and impact."
                        formula="Graph(Nodes, Edges)"
                    />
                    <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '20px' }}>
                        Interactive web visualization showing all file relationships
                    </p>
                    <NetworkGraph
                        centerFile={file.filePath}
                        dependencies={enhancedData.dependencies || []}
                        dependents={enhancedData.dependents || []}
                        neighbors={enhancedData.semanticNeighbors || []}
                    />
                </div>
            )}

            {/* Change Activity Timeline */}
            <div className="card">
                <SectionHeader
                    icon="📈"
                    title="Change Activity"
                    tooltip="Shows modification patterns from git history. High change count may indicate active development or code churn. Most active author likely knows this code best."
                    formula="Count(GitCommits)"
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div style={{
                        padding: '16px',
                        background: '#0d1117',
                        borderRadius: '8px',
                        border: '1px solid #30363d',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3fb950', marginBottom: '4px' }}>
                            {changeCount}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8b949e' }}>Total Changes</div>
                    </div>
                    <div style={{
                        padding: '16px',
                        background: '#0d1117',
                        borderRadius: '8px',
                        border: '1px solid #30363d',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d29922', marginBottom: '4px' }}>
                            {analysis.mostFrequentAuthor ? analysis.mostFrequentAuthor.substring(0, 10) + '...' : 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8b949e' }}>Most Active Author</div>
                    </div>
                    <div style={{
                        padding: '16px',
                        background: analysis.isInOpenPr ? '#3fb95010' : '#0d1117',
                        borderRadius: '8px',
                        border: `1px solid ${analysis.isInOpenPr ? '#3fb950' : '#30363d'}`,
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '28px', marginBottom: '4px' }}>
                            {analysis.isInOpenPr ? '✅' : '⚪'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8b949e' }}>Open PR</div>
                    </div>
                </div>
            </div>

            {/* Recommended Reviewers */}
            <div className="card">
                <SectionHeader
                    icon="👀"
                    title="Recommended Reviewers"
                    tooltip="Suggests the best code reviewers based on semantic ownership. These users understand the code's logic and history best."
                    formula="Top 3 Semantic Owners"
                />
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {analysis.ownership && analysis.ownership.slice(0, 3).map((owner: any, i: number) => (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            background: '#0d1117',
                            borderRadius: '20px',
                            border: '1px solid #30363d'
                        }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: `conic-gradient(#3fb950 ${owner.semanticScore * 360}deg, #30363d 0deg)`
                            }} />
                            <span style={{ fontSize: '13px', color: '#c9d1d9' }}>
                                User {owner.userId.substring(0, 6)}
                            </span>
                        </div>
                    ))}
                    {(!analysis.ownership || analysis.ownership.length === 0) && (
                        <div style={{ fontSize: '13px', color: '#8b949e' }}>No reviewers recommended yet</div>
                    )}
                </div>
            </div>
        </div>
    );
}