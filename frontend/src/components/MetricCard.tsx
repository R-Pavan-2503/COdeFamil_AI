import InfoTooltip from './InfoTooltip';

// Metric Card Component
export default function MetricCard({ icon, title, value, subtitle, color = '#58a6ff', trend, tooltip, formula }: any) {
    return (
        <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
            border: `1px solid ${color}40`,
            borderRadius: '12px',
            position: 'relative',
            // overflow: 'hidden' REMOVED so tooltip can pop out
        }}>
            {/* Background Icon Layer - Clipped independently */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                pointerEvents: 'none', // Let clicks pass through
                zIndex: 0
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    fontSize: '80px',
                    opacity: 0.1
                }}>{icon}</div>
            </div>

            <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 100 // Ensure tooltip sits above everything
            }}>
                <InfoTooltip text={tooltip} formula={formula} />
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', fontWeight: 500 }}>
                    {title}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color, marginBottom: '4px' }}>
                    {value}
                </div>
                {subtitle && (
                    <div style={{ fontSize: '11px', color: '#8b949e' }}>
                        {subtitle}
                    </div>
                )}
                {trend && (
                    <div style={{
                        fontSize: '12px',
                        marginTop: '8px',
                        color: trend > 0 ? '#3fb950' : '#f85149',
                        fontWeight: 600
                    }}>
                        {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}% from last week
                    </div>
                )}
            </div>
        </div>
    );
}
