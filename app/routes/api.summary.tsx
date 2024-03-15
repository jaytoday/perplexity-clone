import { json, LoaderFunction } from '@remix-run/node';
import { summarizeSearchResults } from '~/services/openai';
import type { SearchResult } from '~/types';

export const action: LoaderFunction = async ({ request }): Promise<Response> => {
  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  const requestBody = await request.json();
  const { query, searchResults }: { query: string; searchResults: SearchResult[] } = requestBody;

  if (!query || !searchResults) {
    return json({ error: 'Query and search results are required' }, { status: 400 });
  }

  try {
    const summary: string = await summarizeSearchResults(query, searchResults);
    return json({ summary });
  } catch (error) {
    return json({ error: 'Failed to generate summary' }, { status: 500 });
  }
};