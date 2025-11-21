const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');
const TypeScript = require('tree-sitter-typescript').typescript;
const Python = require('tree-sitter-python');
const Go = require('tree-sitter-go');

// Test JavaScript
console.log('========== JAVASCRIPT ==========');
const jsParser = new Parser();
jsParser.setLanguage(JavaScript);
const jsCode = `import React from "react";
import { useState } from "react";
const x = require('./test');`;
const jsTree = jsParser.parse(jsCode);
findImports(jsTree.rootNode, 'JavaScript');

// Test TypeScript
console.log('\n========== TYPESCRIPT ==========');
const tsParser = new Parser();
tsParser.setLanguage(TypeScript);
const tsCode = `import { Component } from '@angular/core';
import type { User } from './types';`;
const tsTree = tsParser.parse(tsCode);
findImports(tsTree.rootNode, 'TypeScript');

// Test Python
console.log('\n========== PYTHON ==========');
const pyParser = new Parser();
pyParser.setLanguage(Python);
const pyCode = `import os
from typing import List
from .utils import helper`;
const pyTree = pyParser.parse(pyCode);
findImports(pyTree.rootNode, 'Python');

// Test Go
console.log('\n========== GO ==========');
const goParser = new Parser();
goParser.setLanguage(Go);
const goCode = `import "fmt"
import (
    "os"
    "strings"
)`;
const goTree = goParser.parse(goCode);
findImports(goTree.rootNode, 'Go');

function findImports(node, lang) {
    if (node.type.includes('import') && node.type !== 'import' && node.type !== 'import_clause') {
        console.log(`\n${lang} - Found: ${node.type}`);
        console.log(`  Text: ${node.text.substring(0, 80)}`);
        console.log(`  Children:`);
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            console.log(`    [${i}] ${child.type}: "${child.text.substring(0, 40)}"`);
        }
        // Check for field names
        console.log(`  Fields:`);
        const node_fields = ['source', 'module', 'name', 'spec', 'path'];
        for (const field of node_fields) {
            const fieldNode = node.childForFieldName ? node.childForFieldName(field) : null;
            if (fieldNode) {
                console.log(`    ${field}: "${fieldNode.text}"`);
            }
        }
    }

    for (const child of node.children) {
        findImports(child, lang);
    }
}
