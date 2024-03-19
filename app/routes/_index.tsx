import React, { useEffect, useState } from 'react';
import { json } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node'; 
import { useLoaderData, useFetcher } from '@remix-run/react';

import { LoadingIcon, SearchResults, SearchSummary } from '~/components';
import type { SearchResponse, SummaryResponse } from '~/types';

interface LoaderData {
  initialQuery: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const initialQuery = url.searchParams.get('q') || '';
  return json({ initialQuery });
};

export default function Index() {
  const { initialQuery } = useLoaderData<LoaderData>();
  const searchFetcher = useFetcher();
  const searchResponse = searchFetcher.data as SearchResponse | undefined;
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      searchFetcher.load(`/api/search?query=${encodeURIComponent(initialQuery)}`);
    }
  }, [initialQuery]);


  useEffect(() => {
    if (searchResponse && searchFetcher.state === 'idle') {
      setIsLoadingSummary(true);
      fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          searchResults: searchResponse.searchResults,
        }),
      }).then(async (response) => {
        if (response.ok) {
          const data: SummaryResponse = await response.json();
          setSummary(data.summary);
        }
      }).catch((error) => {
        console.error('Error fetching summary:', error);
      }).finally(() => {
        setIsLoadingSummary(false);
      });
    }
  }, [searchResponse]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setSummary(null);
    setQuery(event.currentTarget.query.value);
    history.pushState({}, '', `/?q=${encodeURIComponent(event.currentTarget.query.value)}`);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-left p-8 bg-white shadow-md rounded-lg w-full max-w-screen-xl">
        <h1 className="mt-10 text-3xl font-bold mb-4 ml-4"><span className="mr-2">🔍</span> Search With AI</h1>
        <searchFetcher.Form method="get" action="/api/search" className="space-y-4" onSubmit={handleSubmit}>
          <div className="p-2">
              <input
                type="search"
                name="query"
                id="search"
                defaultValue={initialQuery ?? ''}
                placeholder="Search the web"
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 block w-full shadow-sm md:text-lg lg:text-xl border-gray-300 rounded-md"
              />
            
            <button type="submit" className="w-full mt-4 p-4 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              Search
            </button>
        </div>
        </searchFetcher.Form>
        <div className="my-8 mx-auto">
          {searchFetcher.state === 'idle' && isLoadingSummary ? (
            <span className="font-bold text-xl inline-flex ml-4">
              <LoadingIcon size={7} />
              <span className="ml-2">Loading AI Summary...</span>
            </span>
          ) : (
            summary && <SearchSummary summary={summary} />
          )}
          {searchFetcher.state !== 'idle' ? (
            <span className="font-bold text-xl inline-flex ml-4">
              <LoadingIcon size={7} />
              <span className="ml-2">Loading Search Results...</span>
            </span>
          ) : (
            searchResponse?.searchResults
              ? <SearchResults results={searchResponse.searchResults} /> 
              : null
          )}
        </div>
      </div>
    </div>
  );
}