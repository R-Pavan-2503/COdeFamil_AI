"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const treeSitterAdapter_1 = require("./src/parser/treeSitterAdapter");
async function testImportExtraction() {
    console.log('===== TESTING IMPORT EXTRACTION =====\n');
    // Test JavaScript ES6 imports
    console.log('1. JavaScript ES6 Imports:');
    const jsCode = `
import React from 'react';
import { useState, useEffect } from 'react';
import * as utils from './utils';
`;
    const jsResult = await (0, treeSitterAdapter_1.parseCode)(jsCode, 'javascript');
    console.log('Imports found:', jsResult.imports);
    console.log('Expected: react, react, ./utils');
    console.log('✓ Test passed:', jsResult.imports.length === 3);
    console.log('');
    // Test JavaScript CommonJS require
    console.log('2. JavaScript CommonJS require():');
    const cjsCode = `
const express = require('express');
const path = require('path');
const utils = require('./utils');
`;
    const cjsResult = await (0, treeSitterAdapter_1.parseCode)(cjsCode, 'javascript');
    console.log('Imports found:', cjsResult.imports);
    console.log('Expected: express, path, ./utils');
    console.log('✓ Test passed:', cjsResult.imports.length === 3);
    console.log('');
    // Test TypeScript imports
    console.log('3. TypeScript Imports:');
    const tsCode = `
import { Component } from '@angular/core';
import type { User } from './types';
import axios from 'axios';
`;
    const tsResult = await (0, treeSitterAdapter_1.parseCode)(tsCode, 'typescript');
    console.log('Imports found:', tsResult.imports);
    console.log('Expected: @angular/core, ./types, axios');
    console.log('✓ Test passed:', tsResult.imports.length === 3);
    console.log('');
    // Test Python imports
    console.log('4. Python Imports:');
    const pyCode = `
import os
import sys
from typing import List
from .utils import helper
`;
    const pyResult = await (0, treeSitterAdapter_1.parseCode)(pyCode, 'python');
    console.log('Imports found:', pyResult.imports);
    console.log('Expected: os, sys, typing, .utils');
    console.log('✓ Test passed:', pyResult.imports.length === 4);
    console.log('');
    // Test Go imports
    console.log('5. Go Imports:');
    const goCode = `
import "fmt"
import (
    "os"
    "strings"
)
`;
    const goResult = await (0, treeSitterAdapter_1.parseCode)(goCode, 'go');
    console.log('Imports found:', goResult.imports);
    console.log('Expected: fmt, os, strings');
    console.log('✓ Test passed:', goResult.imports.length === 3);
    console.log('');
    // Summary
    console.log('\n===== TEST SUMMARY =====');
    const allPassed = jsResult.imports.length === 3 &&
        cjsResult.imports.length === 3 &&
        tsResult.imports.length === 3 &&
        pyResult.imports.length === 4 &&
        goResult.imports.length === 3;
    if (allPassed) {
        console.log('✓ ALL TESTS PASSED! Import extraction is working correctly.');
    }
    else {
        console.log('✗ SOME TESTS FAILED. Please review the output above.');
    }
}
testImportExtraction().catch(console.error);
