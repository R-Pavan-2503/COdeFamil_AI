import InfoTooltip from './InfoTooltip';

// Section Header with Tooltip
export default function SectionHeader({ icon, title, tooltip, formula }: { icon: string; title: string; tooltip: string; formula?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{icon}</span> {title}
            </h3>
            <InfoTooltip text={tooltip} formula={formula} />
        </div>
    );
}
