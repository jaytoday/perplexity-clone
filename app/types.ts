export type SearchResult = {
    position: number;
    title: string;
    link: string;
    redirect_link: string;
    displayed_link: string;
    favicon: string;
    snippet: string;
    snippet_highlighted_words: string[];
    sitelinks?: {
      inline?: {
        title: string;
        link: string;
      }[];
      expanded?: {
        title: string;
        link: string;
        snippet: string;
      }[];
    }
    source: string;
  };
  
export type SearchResponse = {
  searchResults: SearchResult[]; 
}

export type SummaryResponse = {
  summary: string;
}