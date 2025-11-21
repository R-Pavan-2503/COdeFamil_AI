const axios = require('axios');

const testCode = `
import React from 'react';
import { useState } from 'react';
const express = require('express');
`;

async function testImportAPI() {
    try {
        const response = await axios.post('http://localhost:3002/parse', {
            code: testCode,
            language: 'javascript'
        });

        console.log('===== API TEST RESULT =====');
        console.log('Functions found:', response.data.functions.length);
        console.log('Imports found:', response.data.imports.length);
        console.log('\nImports:');
        response.data.imports.forEach((imp, idx) => {
            console.log(`  ${idx + 1}. ${imp.module}`);
        });

        if (response.data.imports.length === 3) {
            console.log('\n✓ SUCCESS! Import extraction is working correctly.');
            console.log('  Expected: 3 imports (react, react, express)');
            console.log(`  Got: ${response.data.imports.length} imports`);
        } else {
            console.log('\n✗ FAILED! Import count mismatch.');
            console.log(`  Expected: 3, Got: ${response.data.imports.length}`);
        }
    } catch (error) {
        console.error('Error calling API:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testImportAPI();
