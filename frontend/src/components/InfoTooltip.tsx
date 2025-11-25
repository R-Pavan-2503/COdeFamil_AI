import { useState } from 'react';

interface InfoTooltipProps {
    text: string;
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div style={{ position: 'relative', display: 'inline-block', marginLeft: '6px' }}>
            <span
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                style={{
                    fontSize: '14px',
                    color: '#8b949e',
                    cursor: 'help',
                    userSelect: 'none'
                }}
            >
                ℹ️
            </span>
            {showTooltip && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '8px',
                    padding: '8px 12px',
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#c9d1d9',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    maxWidth: '300px',
                    whiteSpace: 'normal',
                    minWidth: '200px'
                }}>
                    {text}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #30363d'
                    }} />
                </div>
            )}
        </div>
    );
}
