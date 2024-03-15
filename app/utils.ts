import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export async function extractTextFromWebPage(url: string): Promise<string> {
  try {
    // Fetch the HTML content from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${url}`);
    }
    const html = await response.text();

    // Use JSDOM to parse the HTML
    const dom = new JSDOM(html, { url });

    // Use Readability to extract meaningful content
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    // Return the text content of the article, or an empty string if not found
    return article?.textContent.trim() || '';
  } catch (error) {
    console.error(`Error extracting text from URL (${url}):`, error);
    return ''; // Return an empty string or handle the error as appropriate
  }
}
