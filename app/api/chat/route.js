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
  let systemMessage = `You are a helpful assistant. You will be provided documents from a knowledge base to inform your answers.`;

  // TODO - Use prompt chaining to convert the user's message to an optimized search query

  const optimizedQueries = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({
      query : z.nullable(z.string())
    }),
    prompt: `Optimize the user's message to a search query for vector search. The first item in the queries array should be the most optimized search query.
    If the user's message does not require searching a knowledge base, return null.
    ---
    The user's message is: ${messages[messages.length - 1].content}`,
  });

  console.log(optimizedQueries);

  if (optimizedQueries.object.query !== null) {

    // TODO - Use embeddings to take advantage of the semantic similarity of the user's message and the knowledge base

    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: optimizedQueries.object.query,
    });

    // TODO - Add the logic to search for the answer or contextual information in the knowledge base with Azure Search

    console.log(process.env);

    const searchClient = new SearchClient(
      process.env.AZURE_SEARCH_ENDPOINT,
      process.env.AZURE_SEARCH_INDEX,
      new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY),
    );

    let searchOptions = {
      select: ['id', 'url', 'content'],
      top: 5,
      // vectorSearchOptions: {
      //   queries: [
      //     {
      //       kind: "vector",
      //       vector: embedding,
      //       kNearestNeighborsCount: 50,
      //       fields: ['vector']
      //     }
      //   ]
      // }
    }

    const searchResults = await searchClient.search(optimizedQueries.query, searchOptions);

    // TODO - Insert a system message with the answer or contextual information found in the knowledge base

    systemMessage += `The following are the search results from the knowledge base. Please use this information to inform your answer. All responses should contain the link to the source document using Markdown.
    ---
    `;

    for await (const result of searchResults.results) {
      systemMessage += `
      Title: ${result.document.id}
      URL: ${result.document.url}
      Content: ${result.document.content}
      
      `;
    };

    // Todo - Truncate the system message to the maximum token limit
    systemMessage = systemMessage.slice(0, MAX_TOKENS);
  }

  const result = await streamText({
    model: openai('gpt-4o'),
    system: systemMessage,
    messages,
  });

  return result.toAIStreamResponse();
}