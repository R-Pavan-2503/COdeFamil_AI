import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
    to?: string;
    label?: string;
}

export default function BackButton({ to, label = 'Back' }: BackButtonProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <button
            onClick={handleClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#21262d',
                border: '1px solid #30363d',
                color: '#c9d1d9',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '20px'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2d333b';
                e.currentTarget.style.borderColor = '#58a6ff';
                e.currentTarget.style.color = '#58a6ff';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = '#21262d';
                e.currentTarget.style.borderColor = '#30363d';
                e.currentTarget.style.color = '#c9d1d9';
            }}
        >
            <span style={{ fontSize: '16px' }}>←</span>
            <span>{label}</span>
        </button>
    );
}
