const Parser = require('tree-sitter');
const CSharp = require('tree-sitter-c-sharp');

console.log('========== C# ==========');
const csParser = new Parser();
csParser.setLanguage(CSharp);
const csCode = `using System;
using System.Collections.Generic;
using MyNamespace.Models;`;
const csTree = csParser.parse(csCode);

function findImports(node, depth = 0) {
    const indent = '  '.repeat(depth);
    if (node.type.includes('using')) {
        console.log(`${indent}Found: ${node.type}`);
        console.log(`${indent}  Text: ${node.text}`);
        console.log(`${indent}  Children:`);
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            console.log(`${indent}    [${i}] ${child.type}: "${child.text}"`);
        }
    }

    for (const child of node.children) {
        findImports(child, depth + 1);
    }
}

findImports(csTree.rootNode);
