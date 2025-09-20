
import { GoogleGenAI, Type } from "@google/genai";
import type { MetadataResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    focusKeyword: { 
      type: Type.STRING,
      description: "The single most important, high-volume keyword that best represents the page's content."
    },
    title: { 
      type: Type.STRING,
      description: "A compelling, SEO-friendly page title between 40 and 55 characters long."
    },
    description: { 
      type: Type.STRING,
      description: "An engaging meta description between 140 and 155 characters long that encourages clicks from search results."
    },
  },
  required: ['focusKeyword', 'title', 'description'],
};

const MAX_RETRIES = 3;
const MIN_TITLE_LEN = 40;
const MAX_TITLE_LEN = 55;
const MIN_DESC_LEN = 140;
const MAX_DESC_LEN = 155;

type TempMetadata = Omit<MetadataResult, 'url' | 'titleLength' | 'descriptionLength' | 'error'>;

export const generateMetadataForUrl = async (url: string): Promise<TempMetadata> => {
  let lastResult: TempMetadata | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      let prompt: string;

      if (attempt === 0 || !lastResult) {
        // Initial prompt
        prompt = `
          You are an expert SEO specialist with over 10 years of experience. Your task is to generate SEO-optimized metadata for the given URL.

          URL: "${url}"

          Analyze the likely content, context, and purpose of the page at this URL. Based on your analysis, provide the following in a JSON format:

          1.  **focusKeyword**: The single most important, high-volume keyword that best represents the page's core content.
          2.  **title**: A compelling, SEO-friendly page title that is strictly between ${MIN_TITLE_LEN} and ${MAX_TITLE_LEN} characters long. It must be enticing to users on a search engine results page.
          3.  **description**: An engaging meta description that is strictly between ${MIN_DESC_LEN} and ${MAX_DESC_LEN} characters long. It should summarize the page content and include a call-to-action to encourage clicks.
        `;
      } else {
        // Correction prompt for subsequent attempts
        const titleFeedback = lastResult.title.length < MIN_TITLE_LEN || lastResult.title.length > MAX_TITLE_LEN
          ? `(Current Length: ${lastResult.title.length}). THIS IS INCORRECT. Please rewrite it to be between ${MIN_TITLE_LEN}-${MAX_TITLE_LEN} characters.`
          : `(Current Length: ${lastResult.title.length}). This is correct. Do not change it.`;
        
        const descFeedback = lastResult.description.length < MIN_DESC_LEN || lastResult.description.length > MAX_DESC_LEN
          ? `(Current Length: ${lastResult.description.length}). THIS IS INCORRECT. Please rewrite it to be between ${MIN_DESC_LEN}-${MAX_DESC_LEN} characters.`
          : `(Current Length: ${lastResult.description.length}). This is correct. Do not change it.`;

        prompt = `
          You are an SEO metadata correction assistant. Your task is to fix the provided title and/or description to meet strict character length requirements, without losing the original meaning or SEO value.

          URL: "${url}"
          Focus Keyword: "${lastResult.focusKeyword}" // Maintain this keyword

          Previous attempt had validation errors:
          - Title: "${lastResult.title}" ${titleFeedback}
          - Description: "${lastResult.description}" ${descFeedback}

          Instructions:
          - Rewrite the 'title' ONLY if it was incorrect. The new title MUST be strictly between ${MIN_TITLE_LEN} and ${MAX_TITLE_LEN} characters.
          - Rewrite the 'description' ONLY if it was incorrect. The new description MUST be strictly between ${MIN_DESC_LEN} and ${MAX_DESC_LEN} characters.
          - Maintain the original focus keyword.
          - Output ONLY the corrected data in the specified JSON format.
        `;
      }
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.5 + (attempt * 0.1), // Slightly increase temperature for creative corrections
        }
      });

      const jsonText = response.text.trim();
      const parsedData = JSON.parse(jsonText);
      
      lastResult = {
        title: parsedData.title || "",
        description: parsedData.description || "",
        focusKeyword: parsedData.focusKeyword || (lastResult?.focusKeyword || "")
      };

      const isTitleValid = lastResult.title.length >= MIN_TITLE_LEN && lastResult.title.length <= MAX_TITLE_LEN;
      const isDescValid = lastResult.description.length >= MIN_DESC_LEN && lastResult.description.length <= MAX_DESC_LEN;

      if (isTitleValid && isDescValid) {
        return lastResult; // Success!
      }
      // If not valid, loop continues to next attempt with the correction prompt

    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed for ${url}:`, error);
      if (attempt === MAX_RETRIES - 1) {
        // Last retry failed, throw a final error
        throw new Error(`Failed to generate metadata after ${MAX_RETRIES} attempts. Details: ${error instanceof Error ? error.message : 'Unknown API error'}`);
      }
    }
  }

  // If loop finishes, it means all retries failed to meet length constraints
  throw new Error(`Failed to generate metadata within character limits after ${MAX_RETRIES} attempts. Last title length: ${lastResult?.title.length}, description length: ${lastResult?.description.length}`);
};
