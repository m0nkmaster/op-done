/**
 * Simple test script to generate and analyze a small AIFC file
 * For debugging issues with the OP-Z file format
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Constants
const TEST_OUTPUT_PATH = './test-output.aif';
const TEST_SIZE = 44100 * 2; // 2 seconds of audio at 44.1kHz
const SAMPLE_RATE = 44100;

/**
 * Create a simple sine wave buffer
 */
function createTestAudio(sizeInSamples) {
  const buffer = new Float32Array(sizeInSamples);
  const frequency = 440; // A4 note
  
  for (let i = 0; i < sizeInSamples; i++) {
    buffer[i] = Math.sin(2 * Math.PI * frequency * (i / SAMPLE_RATE));
  }
  
  return buffer;
}

/**
 * Convert float audio to 16-bit PCM
 */
function floatToInt16(floatBuffer) {
  const int16Buffer = new Int16Array(floatBuffer.length);
  
  for (let i = 0; i < floatBuffer.length; i++) {
    // Scale to 16-bit range and clamp
    const sample = Math.max(-1, Math.min(1, floatBuffer[i]));
    int16Buffer[i] = Math.round(sample * 32767);
  }
  
  return int16Buffer;
}

/**
 * Create a basic AIFF file with PCM audio
 */
function createTestAiff(sampleData) {
  // AIFF structure
  // - FORM chunk
  // - COMM chunk
  // - SSND chunk
  
  const numSamples = sampleData.length;
  const numChannels = 1;
  const sampleSize = 16;
  const bytesPerFrame = (numChannels * sampleSize) / 8;
  const audioDataBytes = numSamples * bytesPerFrame;
  
  // Size of SSND chunk (audio data + 8 bytes for offset and block size)
  const ssndSize = audioDataBytes + 8;
  
  // Size of COMM chunk (always 18 bytes for standard AIFF)
  const commSize = 18;
  
  // Total data size (excluding FORM header)
  const dataSize = 4 + commSize + 8 + ssndSize; // 4 for 'AIFF' ID
  
  // Allocate buffer for the entire file
  const buffer = Buffer.alloc(8 + dataSize); // 8 for FORM header
  
  // FORM chunk
  buffer.write('FORM', 0);
  buffer.writeUInt32BE(dataSize, 4);
  buffer.write('AIFF', 8);
  
  // COMM chunk
  let pos = 12;
  buffer.write('COMM', pos);
  buffer.writeUInt32BE(commSize, pos + 4);
  
  // COMM chunk data
  buffer.writeUInt16BE(numChannels, pos + 8); // numChannels
  buffer.writeUInt32BE(numSamples, pos + 10); // numSampleFrames
  buffer.writeUInt16BE(sampleSize, pos + 14); // sampleSize
  
  // Sample rate (80-bit IEEE 754 extended)
  // For 44100 Hz, we can hardcode this to the correct bytes
  buffer[pos + 16] = 0x40;
  buffer[pos + 17] = 0x0E;
  buffer[pos + 18] = 0xAC;
  buffer[pos + 19] = 0x44;
  buffer[pos + 20] = 0x00;
  buffer[pos + 21] = 0x00;
  buffer[pos + 22] = 0x00;
  buffer[pos + 23] = 0x00;
  buffer[pos + 24] = 0x00;
  buffer[pos + 25] = 0x00;
  
  // SSND chunk
  pos += commSize + 8;
  buffer.write('SSND', pos);
  buffer.writeUInt32BE(ssndSize, pos + 4);
  buffer.writeUInt32BE(0, pos + 8); // offset
  buffer.writeUInt32BE(0, pos + 12); // blockSize
  
  // Write audio data
  pos += 16;
  for (let i = 0; i < numSamples; i++) {
    buffer.writeInt16BE(sampleData[i], pos + i * bytesPerFrame);
  }
  
  return buffer;
}

/**
 * Analyze a file using the Python script
 */
function analyzeTempFile(filePath) {
  console.log(`\nAnalyzing file: ${filePath}`);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`Error: File ${filePath} does not exist`);
    return;
  }
  
  // Check file size
  const stats = fs.statSync(filePath);
  console.log(`File size: ${stats.size} bytes`);
  
  // Run analysis script
  try {
    const result = spawnSync('python3', ['scripts/analyze_aiff.py', filePath], {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    if (result.error) {
      console.error('Error running analysis:', result.error);
    }
  } catch (err) {
    console.error('Failed to analyze file:', err);
  }
}

// Main execution
try {
  console.log('Creating test audio data...');
  const audioData = createTestAudio(TEST_SIZE);
  const pcmData = floatToInt16(audioData);
  
  console.log('Creating test AIFF file...');
  const aiffData = createTestAiff(pcmData);
  
  console.log(`Writing test file to ${TEST_OUTPUT_PATH}...`);
  fs.writeFileSync(TEST_OUTPUT_PATH, aiffData);
  
  // Analyze the generated file
  analyzeTempFile(TEST_OUTPUT_PATH);
  
  console.log('\nTest complete!');
} catch (err) {
  console.error('Error during test:', err);
}
