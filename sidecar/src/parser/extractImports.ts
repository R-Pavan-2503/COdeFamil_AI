export function extractImports(rootNode: any, language: string) {
    const imports: Array<{
        module: string;
        items?: string[];
    }> = [];

    function traverse(node: any) {
        // JavaScript/TypeScript imports
        if ((language === 'javascript' || language === 'typescript') &&
            node.type === 'import_statement') {

            const sourceNode = node.childForFieldName ? node.childForFieldName('source') : null;
            if (sourceNode) {
                const moduleName = sourceNode.text.replace(/['"]/g, '');
                imports.push({ module: moduleName });
            }
        }

        // Python imports
        if (language === 'python' && (node.type === 'import_statement' || node.type === 'import_from_statement')) {
            const moduleNode = node.childForFieldName ? node.childForFieldName('module') : null;
            if (moduleNode) {
                imports.push({ module: moduleNode.text });
            } else if (node.children) {
                // Fallback: extract from text
                const text = node.text;
                const match = text.match(/from\s+([^\s]+)|import\s+([^\s]+)/);
                if (match) {
                    imports.push({ module: match[1] || match[2] });
                }
            }
        }

        // Go imports
        if (language === 'go' && node.type === 'import_declaration') {
            const specNode = node.childForFieldName ? node.childForFieldName('spec') : null;
            if (specNode) {
                imports.push({ module: specNode.text.replace(/"/g, '') });
            }
        }

        // Traverse children
        if (node.children) {
            for (const child of node.children) {
                traverse(child);
            }
        }
    }

    traverse(rootNode);
    return imports;
}