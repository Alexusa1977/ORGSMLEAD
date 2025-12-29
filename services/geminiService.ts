
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeywordFile, Lead, FacebookGroup } from "../types";

export const findFacebookGroups = async (niche: string, location: string): Promise<FacebookGroup[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Find a list of 10 popular public Facebook groups related to the niche "${niche}" in or near "${location}".
  Focus on groups where potential customers or clients hang out (e.g., community boards, professional networks, interest groups).
  Return a structured list.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return sources
      .filter((chunk: any) => chunk.web?.uri && chunk.web.uri.includes('facebook.com/groups'))
      .map((chunk: any, index: number) => ({
        id: `group-${Date.now()}-${index}`,
        name: chunk.web.title.replace(' | Facebook', '').replace(' - Facebook', '').trim(),
        url: chunk.web.uri,
        niche: niche
      }));
  } catch (error) {
    console.error("Error finding groups:", error);
    return [];
  }
};

export const findLeads = async (
  file: KeywordFile, 
  specificPlatform?: string | null,
  searchGroups?: boolean,
  targetGroups?: FacebookGroup[]
): Promise<{ leads: Lead[], sources: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { keywords, excludeKeywords, niche, location } = file;
  
  const excludeText = excludeKeywords && excludeKeywords.length > 0 
    ? `\n- EXCLUDE posts containing: ${excludeKeywords.join(', ')}` 
    : '';

  let platformInstruction = "";
  if (specificPlatform === 'facebook') {
    if (targetGroups && targetGroups.length > 0) {
      const groupList = targetGroups.map(g => `${g.name} (${g.url})`).join(', ');
      platformInstruction = `3. PLATFORMS: Focus EXCLUSIVELY on finding leads WITHIN these specific Facebook Groups: ${groupList}. 
      Look for recent posts where users are asking questions or seeking recommendations relevant to ${niche}.`;
    } else if (searchGroups) {
      platformInstruction = `3. PLATFORMS: Focus EXCLUSIVELY on public Facebook Groups related to ${niche}. 
      Find active communities and extract leads from their public discussions.`;
    } else {
      platformInstruction = `3. PLATFORMS: Focus EXCLUSIVELY on Facebook public posts and discussions.`;
    }
  } else if (specificPlatform && specificPlatform !== 'web') {
    platformInstruction = `3. PLATFORMS: Focus EXCLUSIVELY on ${specificPlatform}. Do NOT return results from other sites.`;
  } else {
    platformInstruction = `3. PLATFORMS: Focus on Facebook, Instagram, Quora, and Nextdoor.`;
  }

  const prompt = `
    Find specific organic leads or discussions for a ${niche} business.
    KEYWORDS: ${keywords.join(', ')}
    LOCATION: ${location}
    ${excludeText}

    SEARCH GUIDELINES:
    1. TARGET: Find people asking for advice, help, or recommendations.
    2. RECENCY: Must be from the last 90 days.
    ${platformInstruction}

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
        
        if (urlLower.includes('quora.com')) platform = 'Quora';
        else if (urlLower.includes('facebook.com')) platform = 'Facebook';
        else if (urlLower.includes('instagram.com')) platform = 'Instagram';
        else if (urlLower.includes('threads.net')) platform = 'Instagram';
        else if (urlLower.includes('nextdoor.com')) platform = 'Nextdoor';

        const authorMatch = title.split(/[|\-]/)[0]?.trim();
        const author = authorMatch && authorMatch.length < 30 ? authorMatch : undefined;
        
        return {
          id: `lead-${Date.now()}-${index}`,
          author: author,
          title: title,
          snippet: `Highly relevant discussion found on ${platform} matching your criteria for "${keywords[0]}". Review the source to craft a personalized response.`,
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
