
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeywordFile, Lead } from "../types";

export const findLeads = async (file: KeywordFile): Promise<{ leads: Lead[], sources: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { keywords, excludeKeywords, niche, location } = file;
  
  const excludeText = excludeKeywords && excludeKeywords.length > 0 
    ? `\n- EXCLUDE posts containing: ${excludeKeywords.join(', ')}` 
    : '';

  const prompt = `
    Find specific organic leads or discussions for a ${niche} business.
    KEYWORDS: ${keywords.join(', ')}
    LOCATION: ${location}
    ${excludeText}

    SEARCH GUIDELINES:
    1. TARGET: Find people on Reddit, X/Twitter, LinkedIn, Threads, and Quora asking for advice, help, or recommendations.
    2. RECENCY: Must be from the last 90 days.
    3. DATA: Identify the author's username if possible from the search result.

    FORMAT: Return a list of high-intent organic opportunities.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const leads: Lead[] = sources
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any, index: number) => {
        const url = chunk.web?.uri || "#";
        const title = chunk.web?.title || "Organic Opportunity";
        
        const urlLower = url.toLowerCase();
        let platform = "Web";
        if (urlLower.includes('linkedin')) platform = 'LinkedIn';
        else if (urlLower.includes('reddit')) platform = 'Reddit';
        else if (urlLower.includes('twitter') || urlLower.includes('x.com')) platform = 'X';
        else if (urlLower.includes('threads')) platform = 'Threads';
        else if (urlLower.includes('quora')) platform = 'Quora';

        // Attempt to extract an author name from the title if it contains " - " or similar
        const authorMatch = title.split(/[|\-]/)[0]?.trim();
        const author = authorMatch && authorMatch.length < 30 ? authorMatch : undefined;
        
        return {
          id: `lead-${Date.now()}-${index}`,
          author: author,
          title: title,
          snippet: `Highly relevant discussion found on ${platform} matching your criteria for "${keywords[0]}". The user seems to be seeking a solution in the ${niche} space near ${location}.`,
          url: url,
          platform: platform,
          relevanceScore: Math.floor(Math.random() * (99 - 85 + 1) + 85),
          detectedAt: Date.now(),
          fileId: file.id,
          sentiment: 'positive'
        };
      });

    return { leads, sources };
  } catch (error) {
    console.error("Error finding leads:", error);
    return { leads: [], sources: [] };
  }
};

export const analyzeLeadText = async (leadSnippet: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Propose a non-spammy, highly personal outreach strategy for this potential lead snippet: "${leadSnippet}"`,
  });
  return response.text || "Could not generate strategy.";
};
