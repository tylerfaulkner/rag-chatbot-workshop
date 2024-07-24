import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages, generateObject, embed } from 'ai';
import { z } from 'zod';
import { SearchClient } from '@azure/search-documents';
import { AzureKeyCredential } from '@azure/search-documents';


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const MAX_TOKENS = 29000;

export async function POST(req) {
  const { messages } = await req.json();
  let systemMessage = `You are a helpful assistant. You will be provided documents from a knowledge base to inform your answers. Use markdown to format your responses.`;

  const userMessage = messages[messages.length - 1].content;

 const optimizedQuery = await PerformSearchOptimizationChainStep(userMessage);

  if (optimizedQuery === null) {
    return GenerateResponse(messages, systemMessage);
  }

  const embedding = await CreateEmbedding(optimizedQuery);

  const searchResultsSystemPrompt = await GetRetrievalSystemPrompt(optimizedQuery, embedding);

  systemMessage += searchResultsSystemPrompt;

  systemMessage = systemMessage.slice(0, MAX_TOKENS);
  
  return GenerateResponse(messages, systemMessage);
}

/**
 * This function generates a streaming response to the user's message.
 * @param {import('ai').CoreMessage[]} messages the previous messages in the conversation
 * @param {string} systemMessage the system message to provide context to the AI
 * @returns a streaming response object
 */
async function GenerateResponse(messages, systemMessage = 'You are a helpful assistant.') {
  const result = await streamText({
      model: openai('gpt-4o'),
      system: systemMessage,
      messages,
  });

  return result.toAIStreamResponse();
}

/**
 * Returns the embedding for the provided text
 * @param {string} value the text to embed 
 * @returns {import('ai').EmbeddingModelV1Embedding} the embedding for the provided text
 */
async function CreateEmbedding(value) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value,
  });

  return embedding;
}

/**
 * Searches the knowledge base for the answer to the user's questions and returns a system message with the results
 * @param {import('ai').CoreMessage[]} the previous messages in the conversation
 * @param {import('ai').EmbeddingModelV1Embedding} embedding the embedding for the user's message
 * @returns {string} the system message with the search results
 */
async function GetRetrievalSystemPrompt(userQuery, embedding = null) {
  const azureSearchIndexName = process.env.AZURE_SEARCH_INDEX;
  const azureSearchApiKey = process.env.AZURE_SEARCH_API_KEY;
  const azureSearchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;

  // TODO - Implement the Search Logic
  const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT,
    process.env.AZURE_SEARCH_INDEX,
    new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY),
  );

  let searchOptions = {
    select: ['title', 'chunk'],
    top: 5,
  }

  if (embedding) {
    searchOptions.vectorSearchOptions = {
      queries: [
        {
          kind: "vector",
          vector: embedding,
          kNearestNeighborsCount: 50,
          fields: ['vector']
        }
      ]
    }
  }

  const searchResults = await searchClient.search(userQuery, searchOptions);


  const systemPrompt = await BuildSearchResultsSystemPrompt(searchResults.results);

  return systemPrompt;
}

/**
 * Generates a system message from the search results
 * @param {import('@azure/search-documents').SearchIterator} results 
 * @returns {string} the system message with the search results
 */
async function BuildSearchResultsSystemPrompt(results) {
  let systemMessage = `The following are the search results from the knowledge base. Please use this information to inform your answer.
  ---
  `;

  for await (const result of results) {
    systemMessage += `
    Title: ${result.document.title}
    Content: ${result.document.chunk}
    
    `;
  };

  return systemMessage;
}

/**
 * Performs the query optimization chain step to optimize the user's message to a search query for vector search
 * @param {string} userMessage the user's message to optimize 
 * @returns {string | null} the optimized search query or null if the user's message does not require searching a knowledge base
 */
async function PerformSearchOptimizationChainStep(userMessage) {
  const optimizedQueries = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({
      query : z.nullable(z.string())
    }),
    prompt: `Optimize the user's message to a search query for vector search. The first item in the queries array should be the most optimized search query.
    If the user's message does not require searching a knowledge base, return null.
    ---
    The user's message is: ${userMessage}`,
  });

  return optimizedQueries.object.query;
}
