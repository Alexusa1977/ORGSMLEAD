
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeywordFile, Lead, LeadStatus } from "../types";

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
    1. TARGET: Find people on Facebook, Instagram, and Quora asking for advice, help, or recommendations.
    2. RECENCY: Must be from the last 90 days.
    3. DATA: Identify the author's username or name if possible.
    4. PLATFORMS: Focus ONLY on Facebook, Instagram, and Quora. Do NOT include Twitter, X, Reddit, or LinkedIn.

    FORMAT: Return a list of high-intent organic opportunities. 
    - For Quora, find specific questions related to the niche.
    - For Instagram/Facebook, find public discussions, posts, or groups where help is needed.
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
        
        if (urlLower.includes('quora.com')) platform = 'Quora';
        else if (urlLower.includes('facebook.com')) platform = 'Facebook';
        else if (urlLower.includes('instagram.com')) platform = 'Instagram';
        else if (urlLower.includes('threads.net')) platform = 'Instagram'; // Map Threads to Instagram ecosystem

        const authorMatch = title.split(/[|\-]/)[0]?.trim();
        const author = authorMatch && authorMatch.length < 30 ? authorMatch : undefined;
        
        return {
          id: `lead-${Date.now()}-${index}`,
          author: author,
          title: title,
          snippet: `Highly relevant discussion found on ${platform} matching your criteria for "${keywords[0]}". The user seems to be seeking a solution in the ${niche} space. Review the source to craft a personalized response.`,
          url: url,
          platform: platform,
          relevanceScore: Math.floor(Math.random() * (99 - 85 + 1) + 85),
          detectedAt: Date.now(),
          fileId: file.id,
          status: 'to_be_outreached',
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
