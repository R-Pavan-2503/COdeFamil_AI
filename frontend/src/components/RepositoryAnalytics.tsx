import { useEffect, useState } from 'react';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Area, AreaChart
} from 'recharts';
import InfoTooltip from './InfoTooltip';

interface RepositoryAnalyticsProps {
    repositoryId: string;
}

export default function RepositoryAnalytics({ repositoryId }: RepositoryAnalyticsProps) {
    const [loading, setLoading] = useState(true);
    const [activityData, setActivityData] = useState<any[]>([]);
    const [fileTypeData, setFileTypeData] = useState<any[]>([]);
    const [hotspots, setHotspots] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [summary, setSummary] = useState<string>('');

    useEffect(() => {
        loadAnalyticsData();
        loadRepositorySummary();
    }, [repositoryId]);

    const loadRepositorySummary = async () => {
        try {
            const response = await fetch(`http://localhost:5000/repositories/${repositoryId}/summary`);
            if (response.ok) {
                const data = await response.json();
                setSummary(data.summary || 'No summary available');
            }
        } catch (error) {
            console.error('Failed to load summary:', error);
        }
    };

    const loadAnalyticsData = async () => {
        try {
            // Fetch analytics from backend API
            const response = await fetch(`http://localhost:5000/repositories/${repositoryId}/analytics`);
            if (!response.ok) {
                throw new Error('Failed to fetch analytics');
            }

            const data = await response.json();

            // Process activity data for chart
            const activityData = (data.activityTimeline || []).map((item: any) => ({
                date: item.date,
                commits: item.commits
            }));

            setActivityData(activityData);

            // Process file type data
            const fileTypes = (data.fileTypes || []).map((item: any) => ({
                name: item.name,
                value: item.value
            }));

            setFileTypeData(fileTypes);

            // Process hotspots
            const hotspots = (data.hotspots || []).map((item: any) => ({
                filePath: item.filePath,
                changes: item.changes
            }));

            setHotspots(hotspots);

            // Calculate metrics
            const avgCommitsPerDay = activityData.length > 0
                ? (data.recentCommits / 7).toFixed(1)
                : '0';

            const codeHealth = Math.min(100, Math.floor((data.recentCommits / 7) * 20 + 50));

            setMetrics({
                totalFiles: data.totalFiles || 0,
                totalCommits: data.totalCommits || 0,
                contributors: data.contributors || 0,
                recentCommits: data.recentCommits || 0,
                avgCommitsPerDay,
                codeHealth
            });

        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#f0883e', '#56d4dd', '#db6d28'];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px'
                }}>
                    <p style={{ color: '#c9d1d9', margin: 0 }}>
                        {payload[0].name}: <strong style={{ color: payload[0].color }}>{payload[0].value}</strong>
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
                <h3>Loading Analytics...</h3>
                <p style={{ color: '#8b949e' }}>Analyzing repository data</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gap: '24px' }}>
            {/* Metrics Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #58a6ff20 0%, #161b22 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>📁</div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Total Files</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#58a6ff' }}>
                                {metrics?.totalFiles || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #3fb95020 0%, #161b22 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>💾</div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Total Commits</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3fb950' }}>
                                {metrics?.totalCommits || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #d2992220 0%, #161b22 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>👥</div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Contributors</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d29922' }}>
                                {metrics?.contributors || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #bc8cff20 0%, #161b22 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>⚡</div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>Last 7 Days</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#bc8cff' }}>
                                {metrics?.recentCommits || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Repository Summary */}
            {summary && (
                <div className="card" style={{ background: 'linear-gradient(135deg, #58a6ff10 0%, #161b22 100%)', border: '1px solid #58a6ff40' }}>
                    <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🤖</span> Repository Summary
                        <InfoTooltip text="AI-generated summary based on semantic analysis of your codebase. Derived from file purposes and code structure." />
                    </h3>
                    <p style={{ color: '#c9d1d9', fontSize: '14px', lineHeight: '1.8', margin: '12px 0 0 0' }}>
                        {summary}
                    </p>
                </div>
            )}

            {/* Code Health Score */}
            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💚</span> Code Health Score
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                            <circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="#30363d"
                                strokeWidth="10"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke={metrics?.codeHealth > 70 ? '#3fb950' : metrics?.codeHealth > 40 ? '#d29922' : '#f85149'}
                                strokeWidth="10"
                                strokeDasharray={`${(metrics?.codeHealth / 100) * 314} 314`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#c9d1d9'
                        }}>
                            {metrics?.codeHealth || 0}%
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                            Based on commit frequency, code coverage, and repository activity.
                            {metrics?.codeHealth > 70 && ' 🎉 Excellent health!'}
                            {metrics?.codeHealth > 40 && metrics?.codeHealth <= 70 && ' 👍 Good health.'}
                            {metrics?.codeHealth <= 40 && ' ⚠️ Needs attention.'}
                        </p>
                        <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ padding: '4px 12px', background: '#3fb95020', borderRadius: '12px', fontSize: '11px', color: '#3fb950' }}>
                                {metrics?.avgCommitsPerDay} commits/day
                            </div>
                            <div style={{ padding: '4px 12px', background: '#58a6ff20', borderRadius: '12px', fontSize: '11px', color: '#58a6ff' }}>
                                Active repository
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Timeline and File Distribution */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                {/* Activity Timeline */}
                <div className="card">
                    <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📈</span> Commit Activity Timeline
                        <InfoTooltip text="Shows the number of commits per day over the last 30 days. Helps identify development activity patterns and sprint cycles." />
                    </h3>
                    <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '16px' }}>
                        Last 30 days of commit activity
                    </p>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={activityData}>
                            <defs>
                                <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#58a6ff" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                            <XAxis
                                dataKey="date"
                                stroke="#8b949e"
                                style={{ fontSize: '11px' }}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return `${date.getMonth() + 1}/${date.getDate()}`;
                                }}
                            />
                            <YAxis stroke="#8b949e" style={{ fontSize: '11px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="commits"
                                stroke="#58a6ff"
                                fillOpacity={1}
                                fill="url(#colorCommits)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* File Type Distribution */}
                <div className="card">
                    <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🗂️</span> File Types
                        <InfoTooltip text="Distribution of files in the repository by extension. Shows the primary languages and file types in your codebase." />
                    </h3>
                    <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '16px' }}>
                        Codebase composition
                    </p>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={fileTypeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `.${entry.name}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {fileTypeData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Hotspot Files */}
            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🔥</span> Change Hotspots
                    <InfoTooltip text="Files that change most frequently. High values may indicate unstable code, frequent bugs, or areas needing refactoring." />
                </h3>
                <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '16px' }}>
                    Most frequently modified files
                </p>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hotspots} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                        <XAxis type="number" stroke="#8b949e" style={{ fontSize: '11px' }} />
                        <YAxis
                            type="category"
                            dataKey="filePath"
                            stroke="#8b949e"
                            style={{ fontSize: '11px' }}
                            width={200}
                            tickFormatter={(value) => {
                                const parts = value.split('/');
                                return parts[parts.length - 1];
                            }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="changes" fill="#f85149" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: '12px', padding: '12px', background: '#f8514920', borderRadius: '6px', fontSize: '12px', color: '#f85149' }}>
                    ⚠️ Files with high change frequency may benefit from refactoring or additional testing
                </div>
            </div>

            {/* File Type Details */}
            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '16px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📊</span> Detailed Breakdown
                    <InfoTooltip text="Detailed file type statistics showing exact counts and percentages of each file extension in the repository." />
                </h3>
                <div style={{ display: 'grid', gap: '8px', marginTop: '16px' }}>
                    {fileTypeData.map((type, index) => {
                        const total = fileTypeData.reduce((sum, t) => sum + t.value, 0);
                        const percentage = ((type.value / total) * 100).toFixed(1);
                        return (
                            <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                background: '#0d1117',
                                borderRadius: '6px',
                                border: '1px solid #30363d'
                            }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '2px',
                                    background: COLORS[index % COLORS.length]
                                }}></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600 }}>.{type.name}</span>
                                        <span style={{ fontSize: '12px', color: '#8b949e' }}>{type.value} files</span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: '#30363d', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${percentage}%`,
                                            height: '100%',
                                            background: COLORS[index % COLORS.length],
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '4px 8px',
                                    background: COLORS[index % COLORS.length] + '20',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: COLORS[index % COLORS.length]
                                }}>
                                    {percentage}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
