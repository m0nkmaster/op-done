/**
 * AIFF/AIFC File Analyzer
 * 
 * This script analyzes and compares AIFF/AIFC files to help debug OP-Z compatibility issues.
 * Usage: node analyze-aiff.js path/to/file1.aif [path/to/file2.aif]
 */

const fs = require('fs');
const path = require('path');

// Main function
function analyzeAiffFile(filePath) {
  console.log(`\n=== Analyzing ${path.basename(filePath)} ===`);
  
  try {
    const buffer = fs.readFileSync(filePath);
    const fileType = detectFileType(buffer);
    console.log(`File type: ${fileType}`);
    console.log(`File size: ${formatSize(buffer.length)}`);
    
    // Parse main FORM chunk
    const formChunk = parseFormChunk(buffer);
    console.log(`Form type: ${formChunk.formType}`);
    console.log(`Form size: ${formatSize(formChunk.size)}`);
    
    // Parse all chunks
    const chunks = parseChunks(buffer);
    console.log(`\nChunk structure:`);
    chunks.forEach((chunk, index) => {
      console.log(`${index + 1}. ${chunk.id.padEnd(4)} | Size: ${formatSize(chunk.size).padEnd(10)} | Offset: 0x${chunk.offset.toString(16).padStart(8, '0')}`);
      
      // Special handling for known chunk types
      if (chunk.id === 'FVER') {
        const version = buffer.readUInt32BE(chunk.offset + 8);
        console.log(`   Version: 0x${version.toString(16)} (${version})`);
      }
      else if (chunk.id === 'COMM') {
        const numChannels = buffer.readUInt16BE(chunk.offset + 8);
        const numFrames = buffer.readUInt32BE(chunk.offset + 10);
        const sampleSize = buffer.readUInt16BE(chunk.offset + 14);
        console.log(`   Channels: ${numChannels}, Frames: ${numFrames}, Bits: ${sampleSize}`);
        
        if (formChunk.formType === 'AIFC' && chunk.size >= 22) {
          const compType = String.fromCharCode(
            buffer[chunk.offset + 26], 
            buffer[chunk.offset + 27],
            buffer[chunk.offset + 28],
            buffer[chunk.offset + 29]
          );
          console.log(`   Compression: '${compType}'`);
        }
      }
      else if (chunk.id === 'APPL') {
        const appType = String.fromCharCode(
          buffer[chunk.offset + 8], 
          buffer[chunk.offset + 9],
          buffer[chunk.offset + 10],
          buffer[chunk.offset + 11]
        );
        
        console.log(`   App type: '${appType}'`);
        
        if (appType === 'op-1') {
          // This is OP-1 metadata, try to parse as JSON
          try {
            const jsonStart = chunk.offset + 12;
            const jsonEnd = chunk.offset + 8 + chunk.size;
            const jsonStr = buffer.slice(jsonStart, jsonEnd).toString('utf8');
            const metadata = JSON.parse(jsonStr);
            
            console.log(`   Drum version: ${metadata.drum_version}`);
            console.log(`   Name: ${metadata.name}`);
            
            if (metadata.start && metadata.start.length) {
              console.log(`   Slices: ${metadata.start.length}`);
              
              // Calculate slice spacing to check for overlap
              const sliceInfo = [];
              for (let i = 0; i < metadata.start.length; i++) {
                if (!metadata.start[i] && !metadata.end[i]) continue;
                
                const startFrames = Math.round(metadata.start[i] / 4096);
                const endFrames = Math.round(metadata.end[i] / 4096);
                const duration = (endFrames - startFrames) / 44100;
                
                sliceInfo.push({
                  index: i,
                  start: startFrames,
                  end: endFrames,
                  duration: duration.toFixed(3) 
                });
              }
              
              // Print slice information
              console.log(`\n   Slice details (first 10):`);
              for (let i = 0; i < Math.min(10, sliceInfo.length); i++) {
                const slice = sliceInfo[i];
                if (slice.start === slice.end) continue; // Skip empty slices
                console.log(`     Slice ${slice.index}: Start=${slice.start}, End=${slice.end}, Duration=${slice.duration}s`);
              }
              
              // Check for overlapping slices
              let hasOverlap = false;
              for (let i = 0; i < sliceInfo.length - 1; i++) {
                const current = sliceInfo[i];
                const next = sliceInfo[i + 1];
                if (current.end >= next.start) {
                  console.log(`   WARNING: Overlap between slices ${current.index} and ${next.index}`);
                  hasOverlap = true;
                }
              }
              
              if (!hasOverlap) {
                console.log(`   No slice overlaps detected`);
              }
            }
          } catch (e) {
            console.log(`   Error parsing metadata: ${e.message}`);
          }
        }
      }
    });
    
    return { fileType, formType: formChunk.formType, chunks };
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return null;
  }
}

// Detect if file is AIFF or AIFC
function detectFileType(buffer) {
  // Check for FORM chunk
  if (buffer.length < 12) return 'Unknown (too small)';
  
  const formId = buffer.slice(0, 4).toString('ascii');
  if (formId !== 'FORM') return 'Not an AIFF/AIFC file';
  
  const formType = buffer.slice(8, 12).toString('ascii');
  if (formType === 'AIFF') return 'AIFF';
  if (formType === 'AIFC') return 'AIFC';
  
  return 'Unknown IFF type';
}

// Parse the main FORM chunk
function parseFormChunk(buffer) {
  const size = buffer.readUInt32BE(4);
  const formType = buffer.slice(8, 12).toString('ascii');
  
  return {
    id: 'FORM',
    size,
    formType
  };
}

// Parse all chunks in the file
function parseChunks(buffer) {
  const chunks = [];
  let pos = 12; // Skip FORM header
  
  while (pos + 8 <= buffer.length) {
    const id = buffer.slice(pos, pos + 4).toString('ascii');
    const size = buffer.readUInt32BE(pos + 4);
    
    chunks.push({
      id,
      size,
      offset: pos
    });
    
    pos += 8 + size;
    // Add pad byte if chunk size is odd
    if (size % 2 === 1) pos++;
  }
  
  return chunks;
}

// Format file size in human-readable form
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Compare two files
function compareFiles(file1, file2) {
  console.log(`\n=== Comparing ${path.basename(file1)} vs ${path.basename(file2)} ===`);
  
  const data1 = analyzeAiffFile(file1);
  const data2 = analyzeAiffFile(file2);
  
  if (!data1 || !data2) {
    console.log('Cannot compare - one or both files failed analysis');
    return;
  }
  
  console.log('\n=== Key Differences ===');
  
  // Compare file types
  if (data1.fileType !== data2.fileType) {
    console.log(`File type: ${data1.fileType} vs ${data2.fileType}`);
  }
  
  if (data1.formType !== data2.formType) {
    console.log(`Form type: ${data1.formType} vs ${data2.formType}`);
  }
  
  // Compare chunk structure
  console.log('\nChunk structure:');
  
  const chunks1 = data1.chunks.map(c => c.id);
  const chunks2 = data2.chunks.map(c => c.id);
  
  console.log(`File 1: ${chunks1.join(', ')}`);
  console.log(`File 2: ${chunks2.join(', ')}`);
  
  // Find missing chunks
  const missingIn1 = chunks2.filter(c => !chunks1.includes(c));
  const missingIn2 = chunks1.filter(c => !chunks2.includes(c));
  
  if (missingIn1.length > 0) {
    console.log(`Missing in File 1: ${missingIn1.join(', ')}`);
  }
  
  if (missingIn2.length > 0) {
    console.log(`Missing in File 2: ${missingIn2.join(', ')}`);
  }
}

// Main execution
const files = process.argv.slice(2);

if (files.length === 0) {
  console.log('Usage: node analyze-aiff.js path/to/file.aif [path/to/another-file.aif]');
} else if (files.length === 1) {
  analyzeAiffFile(files[0]);
} else {
  compareFiles(files[0], files[1]);
}
