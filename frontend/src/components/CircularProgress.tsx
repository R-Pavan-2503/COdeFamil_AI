// Circular Progress Component
export default function CircularProgress({ value, size = 120, strokeWidth = 12, color = '#3fb950' }: any) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#30363d"
                strokeWidth={strokeWidth}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
            <text
                x={size / 2}
                y={size / 2}
                textAnchor="middle"
                dy="0.3em"
                fontSize="24"
                fontWeight="bold"
                fill={color}
                style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
            >
                {value}%
            </text>
        </svg>
    );
}
