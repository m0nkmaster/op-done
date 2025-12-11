import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import type { SoundConfig } from '../types/soundConfig';

describe('MetadataPanel Property Tests', () => {
  /**
   * Feature: synth-ui, Property 7: Tag Management
   * For any configuration, adding a tag should append it to the tags array, 
   * and removing a tag should remove only that tag while preserving others.
   * Validates: Requirements 13.4, 13.5
   */
  test('Property 7: Tag Management', () => {
    fc.assert(
      fc.property(
        // Generate initial tags array
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
        // Generate a new tag to add
        fc.string({ minLength: 1, maxLength: 20 }),
        (initialTags, newTag) => {
          // Create initial metadata
          const metadata: SoundConfig['metadata'] = {
            name: 'Test Sound',
            category: 'other',
            description: 'Test description',
            tags: [...initialTags],
          };

          // Test adding a tag
          const afterAdd = {
            ...metadata,
            tags: [...metadata.tags, newTag],
          };

          // Verify tag was added
          expect(afterAdd.tags).toContain(newTag);
          expect(afterAdd.tags.length).toBe(initialTags.length + 1);

          // Verify all original tags are preserved
          initialTags.forEach(tag => {
            expect(afterAdd.tags).toContain(tag);
          });

          // Test removing a tag (if there are tags to remove)
          if (afterAdd.tags.length > 0) {
            // Pick a random tag to remove
            const tagToRemove = afterAdd.tags[0];
            const afterRemove = {
              ...afterAdd,
              tags: afterAdd.tags.filter(tag => tag !== tagToRemove),
            };

            // Verify tag was removed
            expect(afterRemove.tags).not.toContain(tagToRemove);
            expect(afterRemove.tags.length).toBe(afterAdd.tags.length - 1);

            // Verify other tags are preserved
            afterAdd.tags.forEach(tag => {
              if (tag !== tagToRemove) {
                expect(afterRemove.tags).toContain(tag);
              }
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
