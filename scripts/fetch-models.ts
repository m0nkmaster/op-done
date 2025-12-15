#!/usr/bin/env bun

/**
 * Fetches latest available models from OpenAI, Anthropic, and Google APIs.
 * 
 * Usage:
 *   bun scripts/fetch-models.ts
 * 
 * Environment variables:
 *   OPENAI_API_KEY - OpenAI API key
 *   ANTHROPIC_API_KEY - Anthropic API key  
 *   GEMINI_API_KEY - Google Gemini API key
 * 
 * Output: Writes to docs/models-{provider}.json
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const docsDir = join(import.meta.dir, '../docs');

interface FetchResult {
  provider: string;
  success: boolean;
  models?: unknown;
  error?: string;
}

async function fetchOpenAIModels(): Promise<FetchResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { provider: 'openai', success: false, error: 'OPENAI_API_KEY not set' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return { provider: 'openai', success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return { provider: 'openai', success: true, models: data };
  } catch (e) {
    return { provider: 'openai', success: false, error: String(e) };
  }
}

async function fetchAnthropicModels(): Promise<FetchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { provider: 'anthropic', success: false, error: 'ANTHROPIC_API_KEY not set' };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      return { provider: 'anthropic', success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return { provider: 'anthropic', success: true, models: data };
  } catch (e) {
    return { provider: 'anthropic', success: false, error: String(e) };
  }
}

async function fetchGoogleModels(): Promise<FetchResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { provider: 'google', success: false, error: 'GEMINI_API_KEY not set' };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      return { provider: 'google', success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return { provider: 'google', success: true, models: data };
  } catch (e) {
    return { provider: 'google', success: false, error: String(e) };
  }
}

async function main() {
  console.log('Fetching models from AI providers...\n');

  const results = await Promise.all([
    fetchOpenAIModels(),
    fetchAnthropicModels(),
    fetchGoogleModels(),
  ]);

  for (const result of results) {
    if (result.success && result.models) {
      const filename = `models-${result.provider}.json`;
      const filepath = join(docsDir, filename);
      writeFileSync(filepath, JSON.stringify(result.models, null, 2));
      
      const modelCount = Array.isArray((result.models as { data?: unknown[] }).data) 
        ? (result.models as { data: unknown[] }).data.length 
        : Array.isArray((result.models as { models?: unknown[] }).models)
          ? (result.models as { models: unknown[] }).models.length
          : 'unknown';
      
      console.log(`✓ ${result.provider}: ${modelCount} models → ${filename}`);
    } else {
      console.log(`✗ ${result.provider}: ${result.error}`);
    }
  }

  console.log('\nDone.');
}

main();

