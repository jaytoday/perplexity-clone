import React from 'react';

type SearchSummaryProps = {
  summary: string;
};

const SearchSummary: React.FC<SearchSummaryProps> = ({ summary }) => (

  <div className="px-10">
    <div className="mx-auto p-4 bg-gray-100 border-2 rounded-md max-w-screen-xl">
        <h2 className="text-xl font-bold">AI Summary</h2>
        <p className="mt-2">{summary}</p>
    </div>
</div>
);

export default SearchSummary;
