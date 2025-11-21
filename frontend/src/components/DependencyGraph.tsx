import { useMemo } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface DependencyGraphProps {
    currentFile: {
        id: string;
        filePath: string;
    };
    dependencies: Array<{ id?: string; filePath: string; dependencyType?: string }>;
    dependents: Array<{ id?: string; filePath: string }>;
}

export default function DependencyGraph({ currentFile, dependencies, dependents }: DependencyGraphProps) {
    // Create nodes and edges for the graph
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // Helper to get filename from path
        const getFileName = (path: string) => {
            const parts = path.split('/');
            return parts[parts.length - 1] || path;
        };

        // Add current file node (center)
        nodes.push({
            id: currentFile.id,
            data: {
                label: (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            📄 CURRENT FILE
                        </div>
                        <div style={{ fontSize: '12px' }}>
                            {getFileName(currentFile.filePath)}
                        </div>
                    </div>
                )
            },
            position: { x: 400, y: 300 },
            style: {
                background: '#58a6ff',
                color: '#0d1117',
                border: '2px solid #58a6ff',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 600,
                width: 220,
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
        });

        // Add dependency nodes (files this file imports) - positioned on the left
        dependencies.forEach((dep, index) => {
            const nodeId = dep.id || `dep-${index}`;
            const yOffset = (index - dependencies.length / 2) * 100;

            nodes.push({
                id: nodeId,
                data: {
                    label: (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '2px' }}>
                                {dep.dependencyType || 'import'}
                            </div>
                            <div style={{ fontSize: '11px' }}>
                                {getFileName(dep.filePath)}
                            </div>
                        </div>
                    )
                },
                position: { x: 50, y: 300 + yOffset },
                style: {
                    background: '#21262d',
                    color: '#c9d1d9',
                    border: '1px solid #3fb950',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    width: 180,
                },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
            });

            // Edge from dependency to current file
            edges.push({
                id: `edge-${nodeId}-${currentFile.id}`,
                source: nodeId,
                target: currentFile.id,
                animated: true,
                style: { stroke: '#3fb950' },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#3fb950',
                },
                label: 'imports',
                labelStyle: { fontSize: '10px', fill: '#8b949e' },
            });
        });

        // Add dependent nodes (files that import this file) - positioned on the right
        dependents.forEach((dep, index) => {
            const nodeId = dep.id || `dependent-${index}`;
            const yOffset = (index - dependents.length / 2) * 100;

            nodes.push({
                id: nodeId,
                data: {
                    label: (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '2px' }}>
                                depends on
                            </div>
                            <div style={{ fontSize: '11px' }}>
                                {getFileName(dep.filePath)}
                            </div>
                        </div>
                    )
                },
                position: { x: 750, y: 300 + yOffset },
                style: {
                    background: '#21262d',
                    color: '#c9d1d9',
                    border: '1px solid #d29922',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    width: 180,
                },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
            });

            // Edge from current file to dependent
            edges.push({
                id: `edge-${currentFile.id}-${nodeId}`,
                source: currentFile.id,
                target: nodeId,
                animated: true,
                style: { stroke: '#d29922' },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#d29922',
                },
                label: 'imported by',
                labelStyle: { fontSize: '10px', fill: '#8b949e' },
            });
        });

        return { nodes, edges };
    }, [currentFile, dependencies, dependents]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    return (
        <div style={{ height: '600px', width: '100%', background: '#0d1117', borderRadius: '8px', border: '1px solid #30363d', position: 'relative' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-left"
            >
                <Background color="#30363d" gap={16} />
                <Controls style={{ background: '#21262d', border: '1px solid #30363d' }} />
                <MiniMap
                    style={{ background: '#0d1117', border: '1px solid #30363d' }}
                    nodeColor={(node) => {
                        if (node.id === currentFile.id) return '#58a6ff';
                        if (node.id.startsWith('dep-')) return '#3fb950';
                        return '#d29922';
                    }}
                />
            </ReactFlow>

            {/* Legend */}
            <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '12px',
                zIndex: 5,
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#c9d1d9' }}>Legend</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#3fb950', borderRadius: '2px' }}></div>
                    <span style={{ color: '#8b949e' }}>Dependencies (imports)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#d29922', borderRadius: '2px' }}></div>
                    <span style={{ color: '#8b949e' }}>Dependents (imported by)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#58a6ff', borderRadius: '2px' }}></div>
                    <span style={{ color: '#8b949e' }}>Current File</span>
                </div>
            </div>

            {/* Stats */}
            <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '12px',
                zIndex: 5,
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#c9d1d9' }}>Graph Stats</div>
                <div style={{ color: '#8b949e', marginBottom: '4px' }}>
                    📦 Dependencies: <span style={{ color: '#3fb950', fontWeight: 'bold' }}>{dependencies.length}</span>
                </div>
                <div style={{ color: '#8b949e' }}>
                    🔗 Dependents: <span style={{ color: '#d29922', fontWeight: 'bold' }}>{dependents.length}</span>
                </div>
            </div>
        </div>
    );
}
