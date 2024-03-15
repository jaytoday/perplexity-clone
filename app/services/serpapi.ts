import { getJson } from 'serpapi';
import { EnvVars } from './env-vars';
import { SearchResult } from '../types';
/**
 * Use this to get the Google search results for a query.
 * Docs: https://github.com/serpapi/serpapi-javascript
 */


/** Search Google for the given query using the SerpApi service. */
export async function searchGoogle(query: string): Promise<SearchResult[]> {
  const results = await getJson({
    engine: "google",
    api_key: EnvVars.serpapi(),
    q: query,
  });

  if ('organic_results' in results) {
    return results.organic_results as SearchResult[];
  } else {
    console.warn(`No organic results found in the response from SerpApi for query ${query}`, results)
  }

  return [];
}
