import { json, LoaderFunction } from '@remix-run/node';
import { searchGoogle } from '~/services/serpapi';
import type { SearchResult } from '~/types';

export const loader: LoaderFunction = async ({ request }): Promise<Response> => {
  const url = new URL(request.url);
  const query = url.searchParams.get('query') || ''; 
  
  if (!query) {
    return json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const searchResults: SearchResult[] = await searchGoogle(query);
    return json({ searchResults });
  } catch (error) {
    return json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
};