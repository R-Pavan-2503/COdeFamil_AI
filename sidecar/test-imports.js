const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');

const parser = new Parser();
parser.setLanguage(JavaScript);

const code = `import React from "react";
import { useState } from "react";
const x = require('./test');
export default function App() {}`;

const tree = parser.parse(code);

function printTree(node, indent = 0) {
    const prefix = '  '.repeat(indent);
    console.log(`${prefix}${node.type} [${node.startPosition.row}:${node.startPosition.column} - ${node.endPosition.row}:${node.endPosition.column}]`);

    if (node.text && node.text.length < 50 && !node.children.length) {
        console.log(`${prefix}  text: "${node.text}"`);
    }

    for (const child of node.children) {
        printTree(child, indent + 1);
    }
}

console.log('===== FULL TREE =====');
printTree(tree.rootNode);

console.log('\n===== IMPORT NODES =====');
function findImports(node) {
    if (node.type.includes('import')) {
        console.log(`Found: ${node.type}`);
        console.log(`  Text: ${node.text}`);
        console.log(`  Children:`);
        for (const child of node.children) {
            console.log(`    - ${child.type}: "${child.text}"`);
        }
    }

    for (const child of node.children) {
        findImports(child);
    }
}

findImports(tree.rootNode);
