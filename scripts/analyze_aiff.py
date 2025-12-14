#!/usr/bin/env python3
"""
AIFF/AIFC File Analyzer

This script analyzes and compares AIFF/AIFC files to help debug OP-Z compatibility issues.
Usage: python3 analyze_aiff.py path/to/file1.aif [path/to/file2.aif]
"""

import os
import sys
import json
import struct
from pathlib import Path


def format_size(bytes_):
    """Format file size in human-readable form"""
    if bytes_ < 1024:
        return f"{bytes_} bytes"
    elif bytes_ < 1024 * 1024:
        return f"{bytes_ / 1024:.2f} KB"
    return f"{bytes_ / (1024 * 1024):.2f} MB"


def detect_file_type(data):
    """Detect if file is AIFF or AIFC"""
    if len(data) < 12:
        return "Unknown (too small)"
    
    form_id = data[0:4].decode('ascii', errors='replace')
    if form_id != 'FORM':
        return "Not an AIFF/AIFC file"
    
    form_type = data[8:12].decode('ascii', errors='replace')
    if form_type == 'AIFF':
        return "AIFF"
    elif form_type == 'AIFC':
        return "AIFC"
    
    return f"Unknown IFF type: {form_type}"


def parse_form_chunk(data):
    """Parse the main FORM chunk"""
    size = struct.unpack('>I', data[4:8])[0]
    form_type = data[8:12].decode('ascii', errors='replace')
    
    return {
        'id': 'FORM',
        'size': size,
        'form_type': form_type
    }


def parse_chunks(data):
    """Parse all chunks in the file"""
    chunks = []
    pos = 12  # Skip FORM header
    
    while pos + 8 <= len(data):
        id_ = data[pos:pos+4].decode('ascii', errors='replace')
        size = struct.unpack('>I', data[pos+4:pos+8])[0]
        
        chunks.append({
            'id': id_,
            'size': size,
            'offset': pos,
            'data': data[pos+8:pos+8+size]
        })
        
        pos += 8 + size
        # Add pad byte if chunk size is odd
        if size % 2 == 1:
            pos += 1
    
    return chunks


def analyze_aiff_file(file_path):
    """Analyze an AIFF or AIFC file"""
    print(f"\n=== Analyzing {Path(file_path).name} ===")
    
    try:
        with open(file_path, 'rb') as f:
            data = f.read()
        
        file_type = detect_file_type(data)
        print(f"File type: {file_type}")
        print(f"File size: {format_size(len(data))}")
        
        # Parse main FORM chunk
        form_chunk = parse_form_chunk(data)
        print(f"Form type: {form_chunk['form_type']}")
        print(f"Form size: {format_size(form_chunk['size'])}")
        
        # Parse all chunks
        chunks = parse_chunks(data)
        print("\nChunk structure:")
        for i, chunk in enumerate(chunks):
            print(f"{i + 1}. {chunk['id'].ljust(4)} | Size: {format_size(chunk['size']).ljust(10)} | Offset: 0x{chunk['offset']:08x}")
            
            # Special handling for known chunk types
            if chunk['id'] == 'FVER':
                version = struct.unpack('>I', chunk['data'][0:4])[0]
                print(f"   Version: 0x{version:x} ({version})")
            
            elif chunk['id'] == 'COMM':
                num_channels = struct.unpack('>H', chunk['data'][0:2])[0]
                num_frames = struct.unpack('>I', chunk['data'][2:6])[0]
                sample_size = struct.unpack('>H', chunk['data'][6:8])[0]
                print(f"   Channels: {num_channels}, Frames: {num_frames}, Bits: {sample_size}")
                
                if form_chunk['form_type'] == 'AIFC' and len(chunk['data']) >= 22:
                    comp_type = chunk['data'][18:22].decode('ascii', errors='replace')
                    print(f"   Compression: '{comp_type}'")
            
            elif chunk['id'] == 'APPL':
                if len(chunk['data']) >= 4:
                    app_type = chunk['data'][0:4].decode('ascii', errors='replace')
                    print(f"   App type: '{app_type}'")
                    
                    if app_type == 'op-1':
                        # This is OP-1 metadata, try to parse as JSON
                        try:
                            json_str = chunk['data'][4:].decode('utf-8', errors='replace')
                            metadata = json.loads(json_str)
                            
                            print(f"   Drum version: {metadata.get('drum_version', 'N/A')}")
                            print(f"   Name: {metadata.get('name', 'N/A')}")
                            
                            if 'start' in metadata and len(metadata['start']) > 0:
                                print(f"   Slices: {len(metadata['start'])}")
                                
                                # Calculate slice spacing to check for overlap
                                slice_info = []
                                for i, (start, end) in enumerate(zip(metadata.get('start', []), metadata.get('end', []))):
                                    if not start and not end:
                                        continue
                                    
                                    start_frames = round(start / 4096)
                                    end_frames = round(end / 4096)
                                    duration = (end_frames - start_frames) / 44100
                                    
                                    slice_info.append({
                                        'index': i,
                                        'start': start_frames,
                                        'end': end_frames,
                                        'duration': f"{duration:.3f}"
                                    })
                                
                                # Print slice information
                                print(f"\n   Slice details (first 10):")
                                for i, slice_ in enumerate(slice_info[:10]):
                                    if slice_['start'] == slice_['end']:
                                        continue  # Skip empty slices
                                    print(f"     Slice {slice_['index']}: Start={slice_['start']}, End={slice_['end']}, Duration={slice_['duration']}s")
                                
                                # Check for overlapping slices
                                has_overlap = False
                                for i in range(len(slice_info) - 1):
                                    current = slice_info[i]
                                    next_ = slice_info[i + 1]
                                    if current['end'] >= next_['start']:
                                        print(f"   WARNING: Overlap between slices {current['index']} and {next_['index']}")
                                        has_overlap = True
                                
                                if not has_overlap:
                                    print("   No slice overlaps detected")
                        
                        except json.JSONDecodeError as e:
                            print(f"   Error parsing metadata: {e}")
                        except Exception as e:
                            print(f"   Error processing metadata: {e}")
        
        # Look for specific issues based on our previous debugging
        print("\nAnalyzing for known issues:")
        
        # Check FVER chunk in AIFC files
        if form_chunk['form_type'] == 'AIFC':
            fver_chunks = [c for c in chunks if c['id'] == 'FVER']
            if not fver_chunks:
                print("❌ ERROR: AIFC file missing required FVER chunk")
            else:
                fver = fver_chunks[0]
                fver_pos = chunks.index(fver)
                if fver_pos != 0:
                    print(f"❌ WARNING: FVER chunk should be the first chunk after FORM, found at position {fver_pos + 1}")
                
                version = struct.unpack('>I', fver['data'][0:4])[0]
                if version != 0xa2805140:
                    print(f"❌ WARNING: FVER version 0x{version:x} doesn't match TE standard 0xa2805140")
                else:
                    print("✅ FVER chunk version matches TE standard")
        
        # Check COMM chunk
        comm_chunks = [c for c in chunks if c['id'] == 'COMM']
        if not comm_chunks:
            print("❌ ERROR: Missing required COMM chunk")
        else:
            comm = comm_chunks[0]
            if form_chunk['form_type'] == 'AIFC':
                if len(comm['data']) < 22:
                    print("❌ ERROR: AIFC COMM chunk too short, missing compression type")
                else:
                    comp_type = comm['data'][18:22].decode('ascii', errors='replace')
                    if comp_type != 'sowt':
                        print(f"❌ WARNING: COMM compression '{comp_type}' doesn't match TE standard 'sowt'")
                    else:
                        print("✅ COMM chunk has correct compression type 'sowt'")
        
        # Check APPL chunk
        appl_chunks = [c for c in chunks if c['id'] == 'APPL']
        if not appl_chunks:
            print("❌ WARNING: Missing APPL chunk with OP-1 metadata")
        else:
            appl = appl_chunks[0]
            if len(appl['data']) < 4 or appl['data'][0:4].decode('ascii', errors='replace') != 'op-1':
                print("❌ WARNING: APPL chunk doesn't have 'op-1' identifier")
            else:
                try:
                    json_str = appl['data'][4:].decode('utf-8', errors='replace')
                    metadata = json.loads(json_str)
                    
                    # Check drum_version
                    drum_version = metadata.get('drum_version')
                    if drum_version is None:
                        print("❌ ERROR: Missing drum_version in metadata")
                    elif (form_chunk['form_type'] == 'AIFC' and drum_version != 2) or \
                         (form_chunk['form_type'] == 'AIFF' and drum_version != 3):
                        print(f"❌ WARNING: drum_version {drum_version} doesn't match expected value for {form_chunk['form_type']}")
                    else:
                        print(f"✅ drum_version {drum_version} matches expected value for {form_chunk['form_type']}")
                    
                    # Check playmode values
                    playmode = metadata.get('playmode', [])
                    if not playmode:
                        print("❌ ERROR: Missing playmode values in metadata")
                    elif form_chunk['form_type'] == 'AIFC' and any(v != 4096 for v in playmode if v):
                        print(f"❌ WARNING: playmode values should be 4096 for AIFC")
                    elif form_chunk['form_type'] == 'AIFF' and any(v != 8192 for v in playmode if v):
                        print(f"❌ WARNING: playmode values should be 8192 for AIFF")
                    else:
                        print(f"✅ playmode values match expected values for {form_chunk['form_type']}")
                
                except Exception as e:
                    print(f"❌ ERROR: Failed to parse APPL metadata: {e}")
        
        return {
            'file_type': file_type,
            'form_type': form_chunk['form_type'],
            'chunks': chunks
        }
    
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None


def compare_files(file1, file2):
    """Compare two AIFF/AIFC files"""
    print(f"\n=== Comparing {Path(file1).name} vs {Path(file2).name} ===")
    
    data1 = analyze_aiff_file(file1)
    data2 = analyze_aiff_file(file2)
    
    if not data1 or not data2:
        print("Cannot compare - one or both files failed analysis")
        return
    
    print("\n=== Key Differences ===")
    
    # Compare file types
    if data1['file_type'] != data2['file_type']:
        print(f"❌ File type: {data1['file_type']} vs {data2['file_type']}")
    
    if data1['form_type'] != data2['form_type']:
        print(f"❌ Form type: {data1['form_type']} vs {data2['form_type']}")
    
    # Compare chunk structure
    chunks1 = [c['id'] for c in data1['chunks']]
    chunks2 = [c['id'] for c in data2['chunks']]
    
    print("\nChunk structure:")
    print(f"File 1: {', '.join(chunks1)}")
    print(f"File 2: {', '.join(chunks2)}")
    
    # Find missing chunks
    missing_in_1 = set(chunks2) - set(chunks1)
    missing_in_2 = set(chunks1) - set(chunks2)
    
    if missing_in_1:
        print(f"❌ Missing in File 1: {', '.join(missing_in_1)}")
    
    if missing_in_2:
        print(f"❌ Missing in File 2: {', '.join(missing_in_2)}")


# Main execution
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 analyze_aiff.py path/to/file.aif [path/to/another-file.aif]")
    elif len(sys.argv) == 2:
        analyze_aiff_file(sys.argv[1])
    else:
        compare_files(sys.argv[1], sys.argv[2])
