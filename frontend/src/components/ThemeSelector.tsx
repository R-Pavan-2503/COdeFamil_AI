import { useState, useEffect } from 'react';

type Theme = 'dark-nebula' | 'warm-beige' | 'purple-dream';

interface ThemeOption {
    id: Theme;
    name: string;
    description: string;
    colors: string[];
}

const themes: ThemeOption[] = [
    {
        id: 'dark-nebula',
        name: '🌌 Dark Nebula',
        description: 'Purple, Blue & Teal',
        colors: ['#7c3aed', '#06b6d4', '#f59e0b']
    },
    {
        id: 'warm-beige',
        name: '☕ Warm Beige',
        description: 'Beige, Black & Brown',
        colors: ['#d4a574', '#6b4423', '#c17146']
    },
    {
        id: 'purple-dream',
        name: '💜 Purple Dream',
        description: 'Purple, Green & Pink',
        colors: ['#a855f7', '#10b981', '#ec4899']
    }
];

export default function ThemeSelector() {
    const [currentTheme, setCurrentTheme] = useState<Theme>('dark-nebula');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme && themes.find(t => t.id === savedTheme)) {
            setCurrentTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }, []);

    const handleThemeChange = (theme: Theme) => {
        setCurrentTheme(theme);
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        setIsOpen(false);
    };

    const currentThemeOption = themes.find(t => t.id === currentTheme) || themes[0];

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-secondary"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    fontSize: '15px'
                }}
            >
                <span>🎨</span>
                <span>{currentThemeOption.name}</span>
                <span style={{
                    transition: 'transform 250ms',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)'
                }}>▼</span>
            </button>

            {isOpen && (
                <div
                    className="glass"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        minWidth: '280px',
                        borderRadius: 'var(--radius-xl)',
                        padding: 'var(--spacing-md)',
                        boxShadow: 'var(--shadow-2xl)',
                        zIndex: 1000,
                        animation: 'fadeIn 250ms ease-out'
                    }}
                >
                    <div style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--spacing-md)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        Choose Theme
                    </div>

                    {themes.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className="btn-ghost"
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--spacing-sm)',
                                border: currentTheme === theme.id ? '2px solid var(--color-border-accent)' : '2px solid transparent',
                                background: currentTheme === theme.id ? 'var(--color-bg-tertiary)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all var(--transition-base)'
                            }}
                        >
                            <div style={{ textAlign: 'left' }}>
                                <div style={{
                                    fontSize: 'var(--font-size-base)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: 'var(--color-text-primary)',
                                    marginBottom: '4px'
                                }}>
                                    {theme.name}
                                </div>
                                <div style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-text-tertiary)'
                                }}>
                                    {theme.description}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {theme.colors.map((color, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: color,
                                            border: '2px solid var(--color-bg-primary)',
                                            boxShadow: 'var(--shadow-md)'
                                        }}
                                    />
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Backdrop to close dropdown when clicking outside */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999
                    }}
                />
            )}
        </div>
    );
}
