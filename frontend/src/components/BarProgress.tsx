// Bar Progress Component
export default function BarProgress({ label, value, maxValue, color }: any) {
    const percentage = (value / maxValue) * 100;
    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#c9d1d9', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '12px', color: '#8b949e' }}>{value}</span>
            </div>
            <div style={{
                width: '100%',
                height: '8px',
                background: '#30363d',
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                }} />
            </div>
        </div>
    );
}
