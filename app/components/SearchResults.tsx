import React from 'react';
import SearchResultItem from './SearchResultItem';
import type { SearchResult } from '../types';

type SearchResultsProps = {
  results: SearchResult[];
};

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => (
  <div className="mt-4">
    {results.map((result, index) => (
      <SearchResultItem key={index} result={result} />
    ))}
  </div>
);

export default SearchResults;
