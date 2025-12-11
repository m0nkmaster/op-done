import { Box, Stack, TextField, Chip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { SegmentedButton } from './SegmentedButton';
import type { SoundConfig } from '../types/soundConfig';

export interface MetadataPanelProps {
  metadata: SoundConfig['metadata'];
  onUpdate: (metadata: SoundConfig['metadata']) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'kick', label: 'Kick' },
  { value: 'snare', label: 'Snare' },
  { value: 'hihat', label: 'HiHat' },
  { value: 'tom', label: 'Tom' },
  { value: 'perc', label: 'Perc' },
  { value: 'bass', label: 'Bass' },
  { value: 'lead', label: 'Lead' },
  { value: 'pad', label: 'Pad' },
  { value: 'fx', label: 'FX' },
  { value: 'other', label: 'Other' },
] as const;

export function MetadataPanel({ metadata, onUpdate }: MetadataPanelProps) {
  const [tagInput, setTagInput] = useState('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...metadata, name: e.target.value });
  };

  const handleCategoryChange = (category: SoundConfig['metadata']['category']) => {
    onUpdate({ ...metadata, category });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...metadata, description: e.target.value });
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !metadata.tags.includes(trimmed)) {
      onUpdate({ ...metadata, tags: [...metadata.tags, trimmed] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdate({ ...metadata, tags: metadata.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Stack spacing={2}>
      {/* Name */}
      <TextField
        label="Name"
        value={metadata.name}
        onChange={handleNameChange}
        size="small"
        fullWidth
      />

      {/* Category */}
      <Box>
        <SegmentedButton
          label="Category"
          value={metadata.category}
          options={CATEGORY_OPTIONS}
          onChange={handleCategoryChange}
        />
      </Box>

      {/* Description */}
      <TextField
        label="Description"
        value={metadata.description}
        onChange={handleDescriptionChange}
        size="small"
        fullWidth
        multiline
        rows={2}
      />

      {/* Tags */}
      <Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            label="Tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            size="small"
            fullWidth
            placeholder="Add a tag..."
          />
          <IconButton
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
            size="small"
            sx={{ alignSelf: 'center' }}
          >
            <AddIcon />
          </IconButton>
        </Box>
        
        {metadata.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {metadata.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                size="small"
              />
            ))}
          </Box>
        )}
      </Box>
    </Stack>
  );
}
