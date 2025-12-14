#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function extractApplJson(data: Uint8Array): string | null {
  let pos = 12;
  while (pos + 8 <= data.length) {
    const id = String.fromCharCode(data[pos], data[pos+1], data[pos+2], data[pos+3]);
    const size = (data[pos+4] << 24) | (data[pos+5] << 16) | (data[pos+6] << 8) | data[pos+7];
    
    if (id === 'APPL') {
      const applData = data.slice(pos + 8, pos + 8 + size);
      const magic = String.fromCharCode(applData[0], applData[1], applData[2], applData[3]);
      
      if (magic === 'op-1') {
        let jsonEnd = size;
        for (let i = 4; i < size; i++) {
          if (applData[i] === 0) {
            jsonEnd = i;
            break;
          }
        }
        return new TextDecoder().decode(applData.slice(4, jsonEnd));
      }
    }
    
    pos += 8 + size;
    if (size % 2 === 1) pos++;
  }
  return null;
}

const basePath = join(import.meta.dir, '../wip-docs/sample-files/comparison-packs');

const oursData = new Uint8Array(readFileSync(join(basePath, 'linn-ours.aif')));
const teData = new Uint8Array(readFileSync(join(basePath, 'linn-te-official.aif')));

const oursJson = extractApplJson(oursData);
const teJson = extractApplJson(teData);

if (oursJson) {
  const parsed = JSON.parse(oursJson);
  console.log('=== OUR FILE (CURRENT) ===\n');
  console.log('First 5 start values:', parsed.start.slice(0, 5));
  console.log('First 5 end values:', parsed.end.slice(0, 5));
  
  console.log('\nDecoded (÷4096):');
  const starts = parsed.start.slice(0, 5).map((v: number) => Math.round(v / 4096));
  const ends = parsed.end.slice(0, 5).map((v: number) => Math.round(v / 4096));
  console.log('Starts:', starts);
  console.log('Ends:', ends);
  console.log('Lengths:', starts.map((s: number, i: number) => ends[i] - s));
  
  // Check gaps
  console.log('\nGaps (end[n] vs start[n+1]):');
  for (let i = 0; i < 4; i++) {
    const gap = starts[i + 1] - ends[i];
    console.log(`  Slice ${i+1} end (${ends[i]}) → Slice ${i+2} start (${starts[i+1]}): gap = ${gap}`);
  }
  
  // Write to file
  writeFileSync(join(basePath, 'ours-current.json'), JSON.stringify(parsed, null, 4));
  console.log('\nWritten to ours-current.json');
}

if (teJson) {
  const parsed = JSON.parse(teJson);
  console.log('\n=== TE OFFICIAL ===\n');
  console.log('First 5 start values:', parsed.start.slice(0, 5));
  console.log('First 5 end values:', parsed.end.slice(0, 5));
  
  console.log('\nDecoded (÷4096):');
  const starts = parsed.start.slice(0, 5).map((v: number) => Math.round(v / 4096));
  const ends = parsed.end.slice(0, 5).map((v: number) => Math.round(v / 4096));
  console.log('Starts:', starts);
  console.log('Ends:', ends);
  console.log('Lengths:', starts.map((s: number, i: number) => ends[i] - s));
}

