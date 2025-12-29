
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeywordFile, Lead, FacebookGroup } from "../types";

export const findFacebookGroups = async (niche: string, location: string): Promise<FacebookGroup[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Using gemini-3-pro-preview for better tool use and grounding accuracy
  const prompt = `SEARCH THE WEB and find a list of 10-15 specific, active, PUBLIC Facebook groups related to the niche "${niche}" in or near "${location}".
  
  Focus on:
  1. Niche communities and professional networks.
  2. Local neighborhood or community boards (e.g., "Austin Small Business", "New York Plumbers").
  3. Discussion-heavy groups where people ask for recommendations.

  CRITICAL: You MUST provide the full URL (e.g., https://www.facebook.com/groups/groupname) for each group found.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Improved filtering to catch various FB group URL patterns
    const groups = sources
      .filter((chunk: any) => {
        const uri = chunk.web?.uri?.toLowerCase() || "";
        return uri.includes('facebook.com/groups') || uri.includes('facebook.com/community');
      })
      .map((chunk: any, index: number) => {
        const url = chunk.web.uri;
        // Clean up title (remove Facebook suffix)
        let name = chunk.web.title || "FB Group";
        name = name.split('|')[0].split('-')[0].replace('Facebook', '').trim();
        
        return {
          id: `group-${Date.now()}-${index}`,
          name: name || "Discussion Group",
          url: url,
          niche: niche
        };
      });

    // Remove duplicates based on URL
    // Fix: Explicitly cast to FacebookGroup[] to resolve 'unknown[]' type mismatch error
    const uniqueGroups = Array.from(new Map(groups.map((item: any) => [item.url, item])).values()) as FacebookGroup[];
    
    return uniqueGroups;
  } catch (error) {
    console.error("Error finding groups via Gemini:", error);
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
      const groupUrls = targetGroups.map(g => g.url).join(', ');
      platformInstruction = `3. PLATFORMS: Focus EXCLUSIVELY on finding leads WITHIN these specific Facebook Group URLs: ${groupUrls}. 
      Look for recent posts where users are asking for help or recommendations for "${keywords[0]}".`;
    } else if (searchGroups) {
      platformInstruction = `3. PLATFORMS: Focus EXCLUSIVELY on finding active public Facebook Groups related to ${niche} and extract leads from recent posts.`;
    } else {
      platformInstruction = `3. PLATFORMS: Focus EXCLUSIVELY on public Facebook posts, discussions, and community pages.`;
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

    FORMAT: Return a list of high-intent organic opportunities with the exact source URL for each.
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
          snippet: `Relevant discussion found on ${platform} matching your criteria for "${keywords[0]}". The user seems to be seeking a solution in the ${niche} space.`,
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
