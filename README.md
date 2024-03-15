# Welcome to the Dexa coding interview

## Post-Exercise Notes 

### Overview of the Current Implementation

1. **User Initiates Search**:
   - The user enters a query into the search interface and starts the search operation.
   - A "Loading Search Results..." text is shown to indicate the search is in progress. 
   - The search automatically initiates if the URL contains a `q` query parameter, which is used to pre-fill the search input. This is useful for sharing search results with others.
   - Currently, a combination of React hooks and API modules are used to manage the search and summary generation. Compared to the use of a Remix action function, the current approach provides more granular control over multi-step processes, such as first fetching and rendering search results, and subsequently fetching and rendering an AI-generated summary. 

2. **Retrieval of Initial Search Results**:
   - An API request is made to the `api/search` API endpoint with a `query` parameter containing the user's search query.
   - The query is sent to SerpAPI, which returns a list of initial search results, including titles, URLs, and snippets.
   - The search results are returned by the search API and displayed to the user, showing the title, URL, and snippet for each result.

3. **Retrieval of AI Summary**:
   - Once the search results are retrieved, a POST request is made to the `api/summary` API endpoint with the search results and the user's query.
   - A "Loading AI Summary..." text is shown to the user to indicate that the AI-generated summary is being retrieved.
   - The code in `app/services/openai.ts` contains the logic for interacting with the OpenAI API to generate a summary based on the search results and the user's query.

4. **Query Rephrased as Question and Search Results Re-Ranked**:
   - An initial API call is made to OpenAI, requesting the query to be rephrased as a question (if necessary) and the search results re-ranked based on their anticipated relevance to the rephrased query. 
   - This step may not strictly be necessary, if the goal is to reduce the number of API requests made to OpenAI. In practice, it would be helpful to evaluate the impact of this step on the quality of the AI-generated summary.


5. **Iterative Fetching and Analysis**:
   - Starting with the highest-ranked result, the AI model attempts to extract or generate a precise answer from each result in order of their ranking.
   - Using the ` extractTextFromWebPage` utility function, text is extracted from the webpage associated with the search result after fetching its URL. 
   - The fetched text along with any previous answers generated as part of this iterative process are provided as input to the AI model. An answer is requested, along with 
   - This process continues iteratively, fetching and analyzing results until a sufficient answer is generated or all top-ranked results have been evaluated.

6. **Generation of Final Summary**:
   - Based on the information retrieved and analyzed, the AI constructs a comprehensive summary or an answer to the user's query.
   - If the AI fails to find a satisfactory answer in the top-ranked results, the most recently generated answer is presented to the user, with the assumption that because it was generated with the context of all the other previously generated answers, it is likely to be the best answer available given the current set of search results. 
   - In practice, there are other potential approaches to consider, such as asking the AI model to choose among the generated answers for the one that is most relevant, rather than using the most recent answer.

7. **Display of AI-Generated Summary or Answer**:
   - The final AI-generated summary or answer is presented to the user.

### Performance

- **Number of API Calls**: There is always one API call to fetch search results. From there, there is always curently one API call made to OpenAI to rephrase the query as a question and re-rank the search results based on anticipated relevance (this step may not strictly be necessary), and a GET request and an API call to OpenAI is made for each search result until a sufficient answer is generated. The best-case scenario is therefore a total of four total external requests made, and the worst-case scenario is a total of 2 + 2x the number of search results retrieved. For example, if the maximum number of search results to fetch and analyze is set to 5, the worst-case scenario would involve a total of 12 external requests.

- **AI Model Interactions**: 

The OpenAI model currently configured to be used is `gpt-3.5-turbo-1106`, which is due to the relative simplicity of the tasks involved and the fact that it is practical to use an inexpensive model for a demo implementation. There are trade-offs involved, including older GPT models being somewhat more likely to hallucinate information.

### Additional Considerations

Search engines handle a variety of query types. Queries might be seeking any of the following:
* A specific answer to a question
* A summary of a topic 
* A comparison of two or more items
* A step-by-step-guide 

And there are a number of other types of queries that could be made. The current implementation is optimized for query types where there is a discrete answer or topic summary being seeked that can be found on a single webpage. Iterations of this project would need to consider the potential use-cases, the requirements of scale and performance, and any other goals, constraints and requirements. It is likely that there would be a dynamic process for determining the best approach to take for a given query, based on a variety of factors such as which of the above query types it is. 

### Next Steps and Potential Improvements

There are a few immediate UI/UX improvements that could be made, such as supporting a streaming answer where tokens are received in chunks and displayed as they are received. This would provide a more responsive experience to the user, especially for longer answers.

In a production scenario it would be slow and expensive to fetch web pages and utilize AI for summarization except where necessary. Considering that a large proportion of searches will be about similar topics, it would be more efficient to pre-compute and cache indexed webpages as well as AI-generated derivative information such as summaries or categories. This is especially true for more esoteric queries where the initial search results may not contain the desired answer.

Additionally, the current implementation is designed primarily for the assumption that the query will map cleanly to one webpage that is most likely to contain a direct answer. A common example of this is a factual query where the answer can be found on a site like Wikipedia. This is sometimes the case, but there are commonly search queries where the best answer may reference composite results from various sources. 

These are a few of the reasons why a search tool would likely make use of retrieval-augmented generation (RAG) to improve its scalability and not rely on fetching webpages individually at runtime. In a RAG pipeline, a large number of documents can be converted into embeddings in a vectorstore, using dense vectors or sparse vectors (SPLADE), the latter of which performs better when the query contains rare or specialize keywords. The context provided to the model with a query is then augmented with embeddings retrieved from the vectorstore using vector similarity search. The use of RAG wasn't deemed to be practical for a demo implementation in which everything is performed at runtime without any use of pre-computation or datastore. 

Regardless of what changes were made, it would be helpful to make use of evaluation tools that could assist with quickly gauging the impact of changes made to prompts, models, APIs (OpenAI, Anthropic, etc.), and architecture. It would be specifically helpful to perform evaluation across a range of types of queries, as it is entirely possible that certain changes may improve quality and performance for some types of queries, but not others. This may lead to considerations around trade-offs, and potentially utilizing different techniques and tools for different types of queries. 


---

This is meant to be a collaborative "open book" exercise. Please use any apps, 
tools, AI, etc that you would normally use while programming.

We have also included a few helpful services/tools to save you time. More 
details below.

## Task

Build a simple clone of [Perplexity](https://www.perplexity.ai/).

When the user submits a new search, they should be presented with the search 
results from Google, as well as an AI generated response to their query, based 
on the retrieved Google search results.

## Setup

1. Use npm to install dependencies
2. Add required environment variables
3. Run `npm run dev` to start the dev server

## Documentation

- Remix: https://remix.run/docs/en/2.3.1
- Dexter (for OpenAI): https://github.com/dexaai/dexter/tree/master
- SerpAPI (for Google search): https://github.com/serpapi/serpapi-javascript

## Services

These are helpful services that we have already configured for you. Find the 
code in `/app/services/`.

- OpenAI: use GPT 3.5
- SerpAPI: get Google search results for a query
