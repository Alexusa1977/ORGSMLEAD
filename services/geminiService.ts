
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeywordFile, Lead } from "../types";

// Fix: Use process.env.API_KEY directly during initialization as per guidelines
export const findLeads = async (file: KeywordFile): Promise<{ leads: Lead[], sources: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { keywords, niche, location } = file;
  
  const prompt = `
    Find potential organic leads, discussions, or social media posts for the following business profile:
    - Niche: ${niche}
    - Keywords: ${keywords.join(', ')}
    - Target Location: ${location}

    Focus on people asking for recommendations, expressing pain points, or seeking services related to these keywords. 
    Analyze public discussions from platforms like Reddit, LinkedIn, Twitter, and niche forums.
    
    Return 3-5 high-quality leads found via Search Grounding.
    For each lead, provide:
    1. A catchy title.
    2. A brief snippet.
    3. The platform name.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    // Fix: Extract grounding chunks from the response candidate's groundingMetadata
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const leads: Lead[] = sources.map((chunk: any, index: number) => {
      const platformMatch = chunk.web?.uri?.match(/linkedin|reddit|twitter|facebook|instagram|quora/i);
      const platform = platformMatch ? platformMatch[0].charAt(0).toUpperCase() + platformMatch[0].slice(1) : "Web Content";
      
      return {
        id: `lead-${Date.now()}-${index}`,
        title: chunk.web?.title || `Potential Lead from ${platform}`,
        snippet: `Lead found regarding ${keywords[0]} in ${location}. Based on current web discussions.`,
        url: chunk.web?.uri || "#",
        platform,
        relevanceScore: 85,
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

// Fix: Use process.env.API_KEY directly and use .text property instead of text() method
export const analyzeLeadText = async (leadSnippet: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this potential customer query and suggest a high-converting personalized response: "${leadSnippet}"`,
  });
  // The text property is a getter, not a function
  return response.text || "Could not generate response suggestion.";
};
