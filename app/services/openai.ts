import { ChatModel, createOpenAIClient, createAIFunction, createAIRunner, Msg } from '@dexaai/dexter';
import { number, string, z } from 'zod';
import { EnvVars } from './env-vars';
import { extractTextFromWebPage } from '../utils';
import type { SearchResult } from '../types';

const MAX_SEARCH_RESULTS_TO_FETCH = 5;
const MAX_SEARCH_PAGE_CONTENT_CHARS = 5000;
const MAX_ANSWER_WORDS = 200;

const OPENAI_MODEL = 'gpt-3.5-turbo-1106';

interface SearchParams {
  updatedQuery: string;
  rankedSearchResults: SearchResult[];
}

export async function summarizeSearchResults(query: string, searchResults: SearchResult[]): Promise<string> {

  const { rankedSearchResults, updatedQuery } = await prepareSearchParams(query, searchResults);
  
  return await generateSearchAnswer(updatedQuery, rankedSearchResults, []);
}

async function prepareSearchParams(query: string, searchResults: SearchResult[]): Promise<SearchParams> {
  /* Rephrase the query as a question (if it is not already) and rank the search results by their likelihood to contain the best answer. */

  let searchParams: SearchParams | undefined; 

  const prompt = `For the query "${query}", call the prepare_search_params function. with a "queryQuestion" parameter rephrasing the query as a question. For example, if the query were to be "Andrew Huberman" rephrase it as "Who is Andrew Huberman?". Also include a "searchResultRankings" parameter with a list of search result IDs in the order of their anticipated utility in answering the query. If none are likely to help, return an empty list. 
  Here are the available search results:
    ${searchResults.slice(0, MAX_SEARCH_RESULTS_TO_FETCH).map((result, index) => `ID #${index}: ${result.title} - ${result.snippet}`).join('\n')}`;

  const prepareSearchParams = createAIFunction(
    {
      name: 'prepare_search_params',
      description: 'Use this to rank search results in order of their anticipated utility in answering the provided query',
      argsSchema: z.object({
        updatedQuery: string().describe('The query rephrased as a question.'),
        searchResultRankings: z
          .array(number())
          .describe(
            'A list of search result IDs in the order of their anticipated utility in answering the query. If none are likely to help, return an empty list.'
          ),
      }),
    },
    async ({ updatedQuery, searchResultRankings }) => {
      console.log(`query "${query}" rephrased as a question: "${updatedQuery}"`)
      const rankedSearchResults: SearchResult[] = [];
      searchResultRankings.forEach((id) => {
        const result = searchResults[id];
        if (result){
          rankedSearchResults.push(result);
        } else {
          console.error(`No result found for index ${id} provided by the AI`);
        }
      });
      console.log(`Re-ranked search results: ${rankedSearchResults.map((result, index) => `${result.title} (${result.link})`).join('\n')}`);
      searchParams = { updatedQuery, rankedSearchResults };
    }
  );

  const prepareSearchParamsRunner = createAIRunner({
    chatModel: new ChatModel({ params: { model: OPENAI_MODEL } }), // Adjust model as necessary
    functions: [prepareSearchParams],
    systemMessage: "Return a sorted list of the IDs of search results most likely to contain the answer to the provided query.",
  });

  await prepareSearchParamsRunner({
    messages: [Msg.user(prompt)],
  });

  if (!searchParams) {
    throw new Error('Failed to generate search parameters');
  }

  return searchParams;

}

async function generateSearchAnswer(
  query: string, 
  searchResults: SearchResult[], 
  answers: string[]
): Promise<string> {

  const nextSearchResult = searchResults[0];
  let nextSearchResultPageContent: string;
  try {
    nextSearchResultPageContent = await extractTextFromWebPage(nextSearchResult.link);
  } catch (error) {
    console.log(`Error extracting text from URL (${nextSearchResult.link}):`, error); // this occasionally happens, for now just catch and move on
    if (searchResults.length === 0) {
      return answers?.[answers.length - 1] || 'Sorry, I was unable to find an answer to your query.'; // very unlikely that no pages can be extracted from, but handle just in case
    }
    return await generateSearchAnswer(query, searchResults.slice(1), [...answers]);
  }

  if (nextSearchResultPageContent.length > MAX_SEARCH_PAGE_CONTENT_CHARS) {
    nextSearchResultPageContent = `${nextSearchResultPageContent.slice(0, MAX_SEARCH_PAGE_CONTENT_CHARS)}...`;
  }

  let answerResponse: { answer: string; requiresMoreInformation: boolean } | undefined;

  const prompt = `You are a helpful assistant providing an answer to the following query: "${query}" 

  If the query is not a question, you may provide a summary of the topic specified by the query. 

   Call the answer_query function with an "answer" parameter providing an answer to the query. Use the additional information provided below to help you generate the answer.

   Document Title: ${nextSearchResult.title}
   
   Document Content: 
   ${nextSearchResultPageContent}
   
   Previous Answers: ${answers.join('\n')}`;

  const generateAnswer = createAIFunction(
    {
      name: 'rank_search_results',
      description: 'Use this to rank search results in order of their anticipated utility in answering the provided query',
      argsSchema: z.object({
        answer: string().describe(`The answer to the query. The answer should be no more than ${MAX_ANSWER_WORDS} words.`),
        requiresMoreInformation: z.boolean().describe('Whether a sufficient answer to the query requires more information.'),
      }),
    },
    async (res) => {
      console.log(`Generated answer: "${res.answer}". Requires more information to answer query: ${res.requiresMoreInformation}`);
      answerResponse = res;
    }
  );

  const generateAnswerRunner = createAIRunner({
    chatModel: new ChatModel({ params: { model: OPENAI_MODEL } }), // Adjust model as necessary
    functions: [generateAnswer],
    systemMessage: "Use the provided information to generate an answer to the specified query.",
  });

  await generateAnswerRunner({
    messages: [Msg.user(prompt)],
  });

  if (!answerResponse) {
    throw new Error('Failed to generate an answer response');
  }

  if (!answerResponse.requiresMoreInformation) {
    // this answer is sufficient to answer the query
    return answerResponse.answer;
  }

  if (searchResults.length === 0) {
    // none of the generated answers have been considered sufficient
    // there are a variety of things we could do from here such as fetch more search results and try again. But we will just return the most recently produced answer.
    return answerResponse.answer;
  }

  return await generateSearchAnswer(query, searchResults.slice(1), [...answers, answerResponse.answer]);

}

