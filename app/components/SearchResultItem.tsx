import React from 'react';
import { SearchResult } from '../types';

type SearchResultItemProps = {
    result: SearchResult;
  };
  
 const SearchResultItem: React.FC<SearchResultItemProps> = ({ result }) => {

    const highlightedSnippet = result.snippet_highlighted_words?.reduce((snippet, word) => {
      const highlightedWord = `<mark>${word}</mark>`;
      return snippet.replace(new RegExp(word, 'gi'), highlightedWord);
    }, result.snippet);
  
    return (
      <div className="mb-4 p-4">
        <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-primary-700 ">
          {result.title}
        </a>
        {highlightedSnippet && (
        <p dangerouslySetInnerHTML={{ __html: highlightedSnippet }} className="mt-1"></p>
        )}
        <div className="flex justify-left mt-2">
          {result.favicon && (
            <img src={result.favicon} alt="" className="mt-1 w-4 h-4 mr-2" />
          )}
         <a href={result.link} target="_blank" rel="noopener noreferrer"> <span className="text-sm text-gray-600">{result.displayed_link}</span></a>
        </div>
        {result.sitelinks?.inline && (
          <div className="mt-2 text-sm">
            {result.sitelinks.inline.map((sitelink, index) => (
              <a key={index} href={sitelink.link} target="_blank" rel="noopener noreferrer" className="text-primary-700 mr-2">{sitelink.title}</a>
            ))}
          </div>
        )}
        <hr className="mt-4" />
      </div>
    );
  };

export default SearchResultItem;
  