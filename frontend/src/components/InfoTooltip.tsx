import { useEffect, useState, useRef } from 'react';

// Tooltip Component with Multiple Pages (Click-to-Toggle / Popover Pattern)
export default function InfoTooltip({ text, formula }: { text: string; formula?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [page, setPage] = useState<'what' | 'how'>('what');
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Reset page after animation would finish
                setTimeout(() => setPage('what'), 200);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div
            ref={tooltipRef}
            style={{ position: 'relative', display: 'inline-block', zIndex: isOpen ? 1000 : 10 }}
        >
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: isOpen
                        ? '#58a6ff'
                        : 'linear-gradient(135deg, #58a6ff, #1f6feb)',
                    border: '1px solid #58a6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: isOpen ? '#0d1117' : '#ffffff',
                    boxShadow: isOpen
                        ? '0 0 0 2px rgba(88, 166, 255, 0.4)'
                        : '0 2px 8px rgba(88, 166, 255, 0.3)',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                }}
            >
                {isOpen ? '✕' : 'ℹ'}
            </div>
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '36px',
                    right: '-10px',
                    width: '320px',
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '12px',
                    zIndex: 1000,
                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(88, 166, 255, 0.2)',
                    animation: 'fadeIn 0.15s ease-out',
                    overflow: 'hidden'
                }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #30363d', background: '#0d1117' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setPage('what'); }}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: page === 'what' ? '#161b22' : 'transparent',
                                color: page === 'what' ? '#58a6ff' : '#8b949e',
                                border: 'none',
                                borderBottom: page === 'what' ? '2px solid #58a6ff' : '2px solid transparent',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: page === 'what' ? '600' : '500',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            💡 What is this?
                        </button>
                        {formula && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setPage('how'); }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: page === 'how' ? '#161b22' : 'transparent',
                                    color: page === 'how' ? '#58a6ff' : '#8b949e',
                                    border: 'none',
                                    borderBottom: page === 'how' ? '2px solid #58a6ff' : '2px solid transparent',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: page === 'how' ? '600' : '500',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                🔢 How calculated?
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px' }}>
                        {page === 'what' ? (
                            <div style={{
                                fontSize: '13px',
                                lineHeight: '1.6',
                                color: '#c9d1d9'
                            }}>
                                {text}
                            </div>
                        ) : (
                            <div>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#8b949e',
                                    marginBottom: '8px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Mathematical Formula
                                </div>
                                <div style={{
                                    padding: '16px',
                                    background: '#0d1117',
                                    border: '1px solid #30363d',
                                    borderRadius: '8px',
                                    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
                                    fontSize: '12px',
                                    color: '#3fb950',
                                    lineHeight: '1.6',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {formula}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Arrow */}
                    <div style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '14px',
                        width: '12px',
                        height: '12px',
                        background: '#161b22', // Match header background
                        border: '1px solid #30363d',
                        borderBottom: 'none',
                        borderRight: 'none',
                        transform: 'rotate(45deg)',
                        zIndex: 1001
                    }} />

                    {/* Cover the arrow border overlap */}
                    <div style={{
                        position: 'absolute',
                        top: '0',
                        right: '12px',
                        width: '16px',
                        height: '2px',
                        background: '#0d1117', // Match tab header background
                        zIndex: 1002
                    }} />
                </div>
            )}
        </div>
    );
}
