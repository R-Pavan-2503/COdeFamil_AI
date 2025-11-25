import { useEffect, useState } from 'react';
import {
    BarChart, Bar, ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import InfoTooltip from './InfoTooltip';

interface TeamInsightsProps {
    repositoryId: string;
}

export default function TeamInsights({ repositoryId }: TeamInsightsProps) {
    const [loading, setLoading] = useState(true);
    const [contributors, setContributors] = useState<any[]>([]);
    const [ownershipData, setOwnershipData] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);

    useEffect(() => {
        loadTeamData();
    }, [repositoryId]);

    const loadTeamData = async () => {
        try {
            // Fetch team insights from backend API
            const response = await fetch(`http://localhost:5000/repositories/${repositoryId}/team-insights`);
            if (!response.ok) {
                throw new Error('Failed to fetch team insights');
            }

            const data = await response.json();

            setContributors(data.contributors || []);
            setOwnershipData(data.ownershipData || []);
            setMetrics({
                totalContributors: data.totalContributors || 0,
                activeContributors: data.activeContributors || 0,
                avgCommitsPerContributor: data.avgCommitsPerContributor || '0',
                mostActiveDay: data.mostActiveDay || 'N/A',
                collaborationScore: Math.min(100, (data.totalContributors || 0) * 15)
            });

        } catch (error) {
            console.error('Failed to load team data:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#f0883e', '#56d4dd', '#db6d28'];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>👥</div>
                <h3>Loading Team Insights...</h3>
                <p style={{ color: '#8b949e' }}>Analyzing collaboration patterns</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gap: '24px' }}>
            {/* Team Metrics Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #58a6ff20 0%, #161b22 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>👥</div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Total Contributors</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#58a6ff' }}>
                                {metrics?.totalContributors || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #3fb95020 0%, #161b22 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>✅</div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Active (7d)</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3fb950' }}>
                                {metrics?.activeContributors || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #d2992220 0%, #161b22 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>📊</div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Avg Commits</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d29922' }}>{
                                metrics?.avgCommitsPerContributor || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #bc8cff20 0%, #161b22 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>📅</div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Most Active</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#bc8cff' }}>
                                {metrics?.mostActiveDay || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collaboration Score */}
            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🤝</span> Team Collaboration Score
                    <InfoTooltip text="Measures team health based on contributor activity, distribution of commits, and code ownership patterns. Higher scores indicate better collaboration." />
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px' }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                        <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#30363d" strokeWidth="8" />
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke={metrics?.collaborationScore > 70 ? '#3fb950' : '#58a6ff'}
                                strokeWidth="8"
                                strokeDasharray={`${(metrics?.collaborationScore / 100) * 251} 251`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '20px',
                            fontWeight: 'bold'
                        }}>
                            {metrics?.collaborationScore || 0}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ color: '#8b949e', fontSize: '14px', margin: 0 }}>
                            Based on number of contributors, commit distribution, and code ownership patterns.
                        </p>
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {metrics?.collaborationScore > 70 && (
                                <div style={{ padding: '4px 12px', background: '#3fb95020', borderRadius: '12px', fontSize: '11px', color: '#3fb950' }}>
                                    🌟 Excellent collaboration
                                </div>
                            )}
                            <div style={{ padding: '4px 12px', background: '#58a6ff20', borderRadius: '12px', fontSize: '11px', color: '#58a6ff' }}>
                                {metrics?.activeContributors}/{metrics?.totalContributors} active
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Contributors */}
            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🏆</span> Top Contributors
                    <InfoTooltip text="Top 10 contributors ranked by commit count and number of files changed. Shows who is most actively contributing code." />
                </h3>
                <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '16px' }}>
                    Ranked by commit count and code impact
                </p>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={contributors.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                        <XAxis
                            dataKey="name"
                            stroke="#8b949e"
                            style={{ fontSize: '11px' }}
                            tickFormatter={(value) => value.substring(0, 10)}
                        />
                        <YAxis stroke="#8b949e" style={{ fontSize: '11px' }} />
                        <Tooltip
                            contentStyle={{
                                background: '#161b22',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                fontSize: '12px'
                            }}
                        />
                        <Legend />
                        <Bar dataKey="commits" fill="#58a6ff" name="Commits" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="filesChanged" fill="#3fb950" name="Files Changed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Contributor Impact Scatter */}
            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💫</span> Contributor Impact Analysis
                    <InfoTooltip text="Visualizes contributor activity by plotting commits vs lines added. Green dots are active contributors (committed in last 7 days), gray are inactive." />
                </h3>
                <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '16px' }}>
                    Commits vs Lines Changed (bubble size = impact score)
                </p>
                <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                        <XAxis
                            type="number"
                            dataKey="commits"
                            name="Commits"
                            stroke="#8b949e"
                            style={{ fontSize: '11px' }}
                        />
                        <YAxis
                            type="number"
                            dataKey="linesAdded"
                            name="Lines Added"
                            stroke="#8b949e"
                            style={{ fontSize: '11px' }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: '#161b22',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                fontSize: '12px'
                            }}
                            cursor={{ strokeDasharray: '3 3' }}
                        />
                        <Scatter name="Contributors" data={contributors} fill="#58a6ff">
                            {contributors.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.active ? '#3fb950' : '#8b949e'}
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
                <div style={{ marginTop: '12px', display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3fb950' }}></div>
                        <span style={{ color: '#8b949e' }}>Active (Last 7 days)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b949e' }}></div>
                        <span style={{ color: '#8b949e' }}>Inactive</span>
                    </div>
                </div>
            </div>

            {/* Ownership Distribution */}
            {ownershipData.length > 0 && (
                <div className="card">
                    <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📂</span> Code Ownership by File Type
                        <InfoTooltip text="Shows which contributors own the most files of each type. Ownership is determined by semantic analysis of code contributions." />
                    </h3>
                    <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '16px' }}>
                        Distribution of file ownership across contributors
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ownershipData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                            <XAxis dataKey="type" stroke="#8b949e" style={{ fontSize: '11px' }} />
                            <YAxis stroke="#8b949e" style={{ fontSize: '11px' }} />
                            <Tooltip
                                contentStyle={{
                                    background: '#161b22',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                }}
                            />
                            <Legend />
                            {contributors.slice(0, 5).map((contributor, index) => (
                                <Bar
                                    key={contributor.name}
                                    dataKey={contributor.name}
                                    stackId="a"
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Contributor Details List */}
            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👤</span> Contributor Details
                    <InfoTooltip text="Complete list of all contributors with their commit count, lines changed, and activity status. Green border indicates active in last 7 days." />
                </h3>
                <div style={{ display: 'grid', gap: '8px', marginTop: '16px' }}>
                    {contributors.map((contributor, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: '#0d1117',
                            borderRadius: '6px',
                            border: `1px solid ${contributor.active ? '#3fb950' : '#30363d'}`
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: COLORS[index % COLORS.length],
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: '#0d1117'
                            }}>
                                {contributor.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{contributor.name}</div>
                                <div style={{ fontSize: '11px', color: '#8b949e' }}>{contributor.email}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '2px' }}>
                                    {contributor.commits} commits
                                </div>
                                <div style={{ fontSize: '11px', color: '#8b949e' }}>
                                    +{contributor.linesAdded} -{contributor.linesRemoved}
                                </div>
                            </div>
                            {contributor.active && (
                                <div style={{
                                    padding: '4px 8px',
                                    background: '#3fb95020',
                                    borderRadius: '12px',
                                    fontSize: '10px',
                                    color: '#3fb950',
                                    fontWeight: 600
                                }}>
                                    ACTIVE
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
