import { useState } from 'react';

interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
    id?: string;
    totalLines?: number;
}

interface FileTreeProps {
    files: any[];
    onFileClick: (fileId: string) => void;
}

export default function FileTree({ files, onFileClick }: FileTreeProps) {
    // Build tree structure from flat file list
    const buildTree = (fileList: any[]): FileNode[] => {
        const root: FileNode[] = [];
        const nodeMap: { [key: string]: FileNode } = {};

        // Sort files by path for better tree construction
        const sortedFiles = [...fileList].sort((a, b) =>
            a.filePath.localeCompare(b.filePath)
        );

        sortedFiles.forEach(file => {
            const parts = file.filePath.split('/');
            let currentPath = '';

            parts.forEach((part: string, index: number) => {
                const isLastPart = index === parts.length - 1;
                const previousPath = currentPath;
                currentPath = currentPath ? `${currentPath}/${part}` : part;

                if (!nodeMap[currentPath]) {
                    const node: FileNode = {
                        name: part,
                        path: currentPath,
                        isDirectory: !isLastPart,
                        children: isLastPart ? undefined : [],
                        id: isLastPart ? file.id : undefined,
                        totalLines: isLastPart ? file.totalLines : undefined
                    };

                    nodeMap[currentPath] = node;

                    if (previousPath) {
                        const parent = nodeMap[previousPath];
                        if (parent && parent.children) {
                            parent.children.push(node);
                        }
                    } else {
                        root.push(node);
                    }
                }
            });
        });

        return root;
    };

    const tree = buildTree(files);

    return (
        <div style={{ fontFamily: 'monospace' }}>
            {tree.map((node, index) => (
                <TreeNode
                    key={index}
                    node={node}
                    onFileClick={onFileClick}
                    level={0}
                />
            ))}
        </div>
    );
}

interface TreeNodeProps {
    node: FileNode;
    onFileClick: (fileId: string) => void;
    level: number;
}

function TreeNode({ node, onFileClick, level }: TreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

    const handleClick = () => {
        if (node.isDirectory) {
            setIsExpanded(!isExpanded);
        } else if (node.id) {
            onFileClick(node.id);
        }
    };

    const getIcon = () => {
        if (node.isDirectory) {
            return isExpanded ? '📂' : '📁';
        }
        // File icons based on extension
        const ext = node.name.split('.').pop()?.toLowerCase();
        const iconMap: { [key: string]: string } = {
            'js': '📜',
            'jsx': '⚛️',
            'ts': '📘',
            'tsx': '⚛️',
            'json': '📋',
            'md': '📝',
            'css': '🎨',
            'html': '🌐',
            'py': '🐍',
            'java': '☕',
            'go': '🔷',
            'rs': '🦀',
            'rb': '💎',
            'php': '🐘',
        };
        return iconMap[ext || ''] || '📄';
    };

    return (
        <div>
            <div
                onClick={handleClick}
                style={{
                    padding: '6px 12px',
                    paddingLeft: `${level * 20 + 12}px`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '4px',
                    transition: 'background 0.15s',
                    userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1c2128';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                }}
            >
                {/* Expand/Collapse Arrow */}
                {node.isDirectory && (
                    <span style={{
                        fontSize: '10px',
                        color: '#8b949e',
                        width: '12px',
                        display: 'inline-block',
                        transition: 'transform 0.2s'
                    }}>
                        {isExpanded ? '▼' : '▶'}
                    </span>
                )}
                {!node.isDirectory && (
                    <span style={{ width: '12px', display: 'inline-block' }}></span>
                )}

                {/* Icon */}
                <span style={{ fontSize: '14px' }}>
                    {getIcon()}
                </span>

                {/* Name */}
                <span style={{
                    color: node.isDirectory ? '#58a6ff' : '#c9d1d9',
                    fontWeight: node.isDirectory ? 600 : 400,
                    fontSize: '13px',
                    flex: 1
                }}>
                    {node.name}
                </span>

                {/* File info */}
                {!node.isDirectory && node.totalLines && (
                    <span style={{
                        fontSize: '11px',
                        color: '#6e7681',
                        marginLeft: 'auto'
                    }}>
                        {node.totalLines} lines
                    </span>
                )}
            </div>

            {/* Children */}
            {node.isDirectory && isExpanded && node.children && (
                <div>
                    {node.children.map((child, index) => (
                        <TreeNode
                            key={index}
                            node={child}
                            onFileClick={onFileClick}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
