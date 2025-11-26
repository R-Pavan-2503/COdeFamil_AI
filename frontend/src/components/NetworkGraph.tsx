import { useRef } from 'react';

interface Node {
    id: string;
    label: string;
    x: number;
    y: number;
    type: 'center' | 'dependency' | 'dependent' | 'neighbor';
}

interface Edge {
    from: string;
    to: string;
    type: 'dependency' | 'dependent' | 'neighbor';
}

interface NetworkGraphProps {
    centerFile: string;
    dependencies?: any[];
    dependents?: any[];
    neighbors?: any[];
}

export default function NetworkGraph({ centerFile, dependencies = [], dependents = [], neighbors = [] }: NetworkGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    const width = 1200;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create nodes and edges
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Center node
    nodes.push({
        id: 'center',
        label: centerFile.split('/').pop() || centerFile,
        x: centerX,
        y: centerY,
        type: 'center'
    });

    // Dependencies (LEFT side)
    const depCount = Math.min(dependencies.length, 8);
    const depSpacing = Math.min(120, 600 / (depCount || 1));
    dependencies.slice(0, 8).forEach((dep, i) => {
        const id = `dep-${i}`;
        const startY = centerY - ((depCount - 1) * depSpacing) / 2;
        nodes.push({
            id,
            label: dep.targetPath?.split('/').pop() || `Dep ${i + 1}`,
            x: 150,
            y: startY + i * depSpacing,
            type: 'dependency'
        });
        edges.push({ from: id, to: 'center', type: 'dependency' });
    });

    // Dependents (RIGHT side)
    const dptCount = Math.min(dependents.length, 8);
    const dptSpacing = Math.min(120, 600 / (dptCount || 1));
    dependents.slice(0, 8).forEach((dep, i) => {
        const id = `dpt-${i}`;
        const startY = centerY - ((dptCount - 1) * dptSpacing) / 2;
        nodes.push({
            id,
            label: dep.sourcePath?.split('/').pop() || `Dependent ${i + 1}`,
            x: width - 150,
            y: startY + i * dptSpacing,
            type: 'dependent'
        });
        edges.push({ from: 'center', to: id, type: 'dependent' });
    });

    // Neighbors (TOP)
    const nbrCount = Math.min(neighbors.length, 6);
    const nbrSpacing = Math.min(180, 900 / (nbrCount || 1));
    neighbors.slice(0, 6).forEach((neighbor, i) => {
        const id = `nbr-${i}`;
        const startX = centerX - ((nbrCount - 1) * nbrSpacing) / 2;
        nodes.push({
            id,
            label: neighbor.filePath?.split('/').pop() || `Neighbor ${i + 1}`,
            x: startX + i * nbrSpacing,
            y: 120,
            type: 'neighbor'
        });
        edges.push({ from: 'center', to: id, type: 'neighbor' });
    });

    const getNodeGradient = (type: string) => {
        switch (type) {
            case 'center': return 'url(#centerGrad)';
            case 'dependency': return 'url(#depGrad)';
            case 'dependent': return 'url(#dptGrad)';
            case 'neighbor': return 'url(#nbrGrad)';
            default: return '#8b949e';
        }
    };

    const getEdgeColor = (type: string) => {
        switch (type) {
            case 'dependency': return '#3fb950';
            case 'dependent': return '#f0883e';
            case 'neighbor': return '#bc8cff';
            default: return '#8b949e';
        }
    };

    const wrapText = (text: string, maxLength: number): string[] => {
        if (text.length <= maxLength) return [text];
        const parts = text.split(/[._-]/);
        if (parts.length > 1) {
            return [parts[0], parts.slice(1).join('')].slice(0, 2);
        }
        return [text.substring(0, maxLength - 2) + '..'];
    };

    return (
        <div style={{
            width: '100%',
            height: '800px',
            background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
            borderRadius: '12px',
            border: '1px solid #30363d',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${height}`}
                style={{ display: 'block' }}
            >
                <defs>
                    <radialGradient id="centerGrad">
                        <stop offset="0%" stopColor="#58a6ff" stopOpacity="1" />
                        <stop offset="100%" stopColor="#1f6feb" stopOpacity="1" />
                    </radialGradient>
                    <radialGradient id="depGrad">
                        <stop offset="0%" stopColor="#56d364" stopOpacity="1" />
                        <stop offset="100%" stopColor="#2ea043" stopOpacity="1" />
                    </radialGradient>
                    <radialGradient id="dptGrad">
                        <stop offset="0%" stopColor="#f0883e" stopOpacity="1" />
                        <stop offset="100%" stopColor="#d15704" stopOpacity="1" />
                    </radialGradient>
                    <radialGradient id="nbrGrad">
                        <stop offset="0%" stopColor="#e5b9ff" stopOpacity="1" />
                        <stop offset="100%" stopColor="#bc8cff" stopOpacity="1" />
                    </radialGradient>
                </defs>

                {/* Draw all edges */}
                {edges.map((edge, i) => {
                    const fromNode = nodes.find(n => n.id === edge.from);
                    const toNode = nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;

                    return (
                        <line
                            key={`edge-${i}`}
                            x1={fromNode.x}
                            y1={fromNode.y}
                            x2={toNode.x}
                            y2={toNode.y}
                            stroke={getEdgeColor(edge.type)}
                            strokeWidth={4}
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* Draw all nodes */}
                {nodes.map((node) => {
                    const nodeSize = node.type === 'center' ? 65 : 45;
                    const textLines = wrapText(node.label, node.type === 'center' ? 11 : 9);

                    return (
                        <g key={node.id}>
                            <circle
                                cx={node.x}
                                cy={node.y}
                                r={nodeSize}
                                fill={getNodeGradient(node.type)}
                                stroke="rgba(255, 255, 255, 0.3)"
                                strokeWidth={2}
                            />

                            {textLines.map((line, idx) => (
                                <text
                                    key={idx}
                                    x={node.x}
                                    y={node.y + (textLines.length === 1 ? 5 : -6 + idx * 13)}
                                    textAnchor="middle"
                                    fill="#0d1117"
                                    fontSize={node.type === 'center' ? 15 : 12}
                                    fontWeight="bold"
                                    style={{
                                        pointerEvents: 'none',
                                        filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))',
                                        fontFamily: 'ui-monospace, monospace'
                                    }}
                                >
                                    {line}
                                </text>
                            ))}
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(22, 27, 34, 0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(48, 54, 61, 0.8)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
                <div style={{ marginBottom: '12px', fontWeight: 700, color: '#58a6ff', fontSize: '13px' }}>
                    📌 Legend
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #58a6ff, #1f6feb)',
                            boxShadow: '0 2px 8px rgba(88, 166, 255, 0.4)'
                        }}></div>
                        <span style={{ color: '#c9d1d9', fontWeight: 500 }}>Current File</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #56d364, #2ea043)',
                            boxShadow: '0 2px 8px rgba(56, 211, 100, 0.4)'
                        }}></div>
                        <span style={{ color: '#c9d1d9', fontWeight: 500 }}>Dependencies (Left)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f0883e, #d15704)',
                            boxShadow: '0 2px 8px rgba(240, 136, 62, 0.4)'
                        }}></div>
                        <span style={{ color: '#c9d1d9', fontWeight: 500 }}>Dependents (Right)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #e5b9ff, #bc8cff)',
                            boxShadow: '0 2px 8px rgba(188, 140, 255, 0.4)'
                        }}></div>
                        <span style={{ color: '#c9d1d9', fontWeight: 500 }}>Similar Files (Top)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
