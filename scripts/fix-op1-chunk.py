#!/usr/bin/env python3
"""
OP-Z AIFF/AIFC Fixer

This script repairs OP-Z AIFF/AIFC files by correctly structuring the chunks.
Usage: python3 fix-op1-chunk.py input.aif output.aif
"""

import os
import sys
import struct
from pathlib import Path

def fix_aiff_file(input_path, output_path):
    """Fix an AIFF/AIFC file to be properly structured for OP-Z compatibility"""
    print(f"Fixing file: {input_path}")
    
    with open(input_path, 'rb') as f:
        data = f.read()
    
    # Check for FORM chunk
    if len(data) < 12 or data[0:4] != b'FORM':
        print("Not a valid AIFF/AIFC file")
        return False
    
    # Check form type
    form_type = data[8:12]
    is_aifc = form_type == b'AIFC'
    print(f"File type: {'AIFC' if is_aifc else 'AIFF'}")
    
    # Parse all chunks
    chunks = []
    pos = 12  # Skip FORM header
    
    while pos + 8 <= len(data):
        chunk_id = data[pos:pos+4]
        chunk_size = struct.unpack('>I', data[pos+4:pos+8])[0]
        
        # Validate size to avoid corrupted chunks
        if chunk_size < 0 or chunk_size > 100000000:
            print(f"Invalid chunk size: {chunk_size} for chunk {chunk_id.decode('ascii', errors='replace')} at {pos}")
            break
        
        chunk_data = data[pos+8:pos+8+chunk_size]
        chunks.append({
            'id': chunk_id,
            'offset': pos,
            'size': chunk_size,
            'data': chunk_data
        })
        
        print(f"Found chunk: {chunk_id.decode('ascii', errors='replace')}, size: {chunk_size} bytes")
        
        pos += 8 + chunk_size
        if chunk_size % 2 == 1:
            pos += 1  # Padding byte for odd-sized chunks
    
    # Find required chunks
    comm_chunk = next((c for c in chunks if c['id'] == b'COMM'), None)
    ssnd_chunk = next((c for c in chunks if c['id'] == b'SSND'), None)
    appl_chunk = next((c for c in chunks if c['id'] == b'APPL'), None)
    op1_chunk = next((c for c in chunks if c['id'] == b'op-1'), None)
    fver_chunk = next((c for c in chunks if c['id'] == b'FVER'), None)
    
    if not comm_chunk:
        print("Error: No COMM chunk found")
        return False
    
    if not ssnd_chunk:
        print("Error: No SSND chunk found")
        return False
    
    # Use metadata from either APPL or op-1 chunk
    metadata_chunk = appl_chunk if appl_chunk else op1_chunk
    
    if metadata_chunk:
        print(f"Using metadata from {metadata_chunk['id'].decode('ascii', errors='replace')} chunk")
    else:
        print("No metadata chunk found - will create minimal one")
    
    # Now rebuild the file with proper structure
    # 1. FORM chunk
    new_chunks = []
    
    # 2. FVER chunk (required for AIFC, we'll add it if missing)
    if is_aifc:
        if fver_chunk:
            print("Using existing FVER chunk")
            new_chunks.append(('FVER', fver_chunk['data']))
        else:
            print("Adding FVER chunk")
            # Version used by TE: 0xA2805140
            new_chunks.append(('FVER', struct.pack('>I', 0xA2805140)))
    
    # 3. COMM chunk
    new_chunks.append(('COMM', comm_chunk['data']))
    
    # 4. APPL chunk (fix if needed)
    if metadata_chunk:
        if metadata_chunk['id'] == b'APPL':
            # Keep as is
            new_chunks.append(('APPL', metadata_chunk['data']))
        else:
            # Convert op-1 chunk to APPL chunk
            print("Converting op-1 chunk to APPL chunk")
            new_chunks.append(('APPL', metadata_chunk['data']))
    else:
        # Create minimal APPL chunk
        print("Creating minimal APPL chunk")
        app_id = b'op-1'
        json_data = b'{"type":"drum","drum_version":2}'
        new_chunks.append(('APPL', app_id + json_data))
    
    # 5. SSND chunk (always last)
    new_chunks.append(('SSND', ssnd_chunk['data']))
    
    # Calculate total size for FORM
    total_size = 4  # For AIFF/AIFC ID
    for chunk_id, chunk_data in new_chunks:
        chunk_size = len(chunk_data)
        total_size += 8 + chunk_size  # 8 for chunk header
        if chunk_size % 2 == 1:
            total_size += 1  # Padding byte
    
    # Build new file
    # FORM header
    output = bytearray()
    output.extend(b'FORM')
    output.extend(struct.pack('>I', total_size))
    output.extend(b'AIFC' if is_aifc else b'AIFF')
    
    # Add all chunks
    for chunk_id, chunk_data in new_chunks:
        output.extend(chunk_id.encode('ascii'))
        chunk_size = len(chunk_data)
        output.extend(struct.pack('>I', chunk_size))
        output.extend(chunk_data)
        
        # Add padding byte if needed
        if chunk_size % 2 == 1:
            output.append(0)
    
    # Write output file
    with open(output_path, 'wb') as f:
        f.write(output)
    
    print(f"Fixed file written to {output_path}")
    print(f"Original size: {len(data)} bytes, New size: {len(output)} bytes")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 fix-op1-chunk.py input.aif output.aif")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} not found")
        sys.exit(1)
    
    if fix_aiff_file(input_file, output_file):
        print("Success!")
    else:
        print("Failed to fix file")
        sys.exit(1)
