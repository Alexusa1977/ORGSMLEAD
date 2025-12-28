
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeywordFile, Lead } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const findLeads = async (file: KeywordFile): Promise<{ leads: Lead[], sources: any[] }> => {
  const { keywords, niche, location } = file;
  
  const prompt = `
    Find potential organic leads, discussions, or social media posts for the following business profile:
    - Niche: ${niche}
    - Keywords: ${keywords.join(', ')}
    - Target Location: ${location}

    Focus on people asking for recommendations, expressing pain points, or seeking services related to these keywords. 
    Analyze public discussions from platforms like Reddit, LinkedIn, Twitter, and niche forums.
    
    Return a detailed analysis of 3-5 high-quality leads found via Search Grounding.
    For each lead, provide:
    1. A catchy title for the discovery.
    2. A brief snippet of what they are saying/asking.
    3. The platform it was found on.
    4. Why it is a good lead (relevance).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const text = response.text || "No leads found at this moment.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Map sources to simulated Leads for the UI
    // In a production app, we would parse the AI response text more strictly.
    // Here we generate structured leads based on the sources returned by Google Search.
    const leads: Lead[] = sources.map((chunk: any, index: number) => {
      const platformMatch = chunk.web?.uri?.match(/linkedin|reddit|twitter|facebook|instagram|quora/i);
      const platform = platformMatch ? platformMatch[0].charAt(0).toUpperCase() + platformMatch[0].slice(1) : "Web Content";
      
      return {
        id: `lead-${Date.now()}-${index}`,
        title: chunk.web?.title || `Potential Lead from ${platform}`,
        snippet: `Discussion found regarding ${keywords[0]} in ${location}. This user is likely looking for ${niche} services.`,
        url: chunk.web?.uri || "#",
        platform,
        relevanceScore: Math.floor(Math.random() * 30) + 70, // Simulated score
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this potential customer query and suggest a high-converting personalized response: "${leadSnippet}"`,
  });
  return response.text || "Could not generate response suggestion.";
};
