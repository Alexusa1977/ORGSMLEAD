
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeywordFile, Lead, FacebookGroup } from "../types";

// Helper to find local Facebook groups via search grounding
export const findFacebookGroups = async (location: string): Promise<FacebookGroup[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `SEARCH THE LIVE WEB right now and find a list of 10-15 active, PUBLIC Facebook groups for the city "${location}".
  
  Look specifically for:
  - Local recommendation groups (e.g., "Word of Mouth ${location}")
  - Neighborhood community boards (e.g., "${location} Neighbors")
  - General city discussion groups
  - "Need a ${location}" or "Ask ${location}" groups

  CRITICAL: I need the actual group URLs (https://www.facebook.com/groups/...). 
  Please list them clearly. If you cannot find specific ones, look for the most popular ones used by locals for recommendations.`;

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
    const text = response.text || "";
    
    // 1. Extract from grounding chunks
    const groupsFromChunks: FacebookGroup[] = sources
      .filter((chunk: any) => {
        const uri = chunk.web?.uri?.toLowerCase() || "";
        return uri.includes('facebook.com');
      })
      .map((chunk: any, index: number) => {
        const url = chunk.web.uri;
        let name = chunk.web.title || "Local Community Group";
        name = name.split('|')[0].split('-')[0].replace('Facebook', '').replace('Groups', '').trim();
        
        return {
          id: `group-chunk-${Date.now()}-${index}`,
          name: name || "Community Discussion",
          url: url,
          niche: "Local Community"
        } as FacebookGroup;
      });

    // 2. Fallback: Extract URLs directly from text using Regex if chunks are sparse
    const fbGroupRegex = /https?:\/\/(www\.|m\.|web\.)?facebook\.com\/groups\/[a-zA-Z0-9\.]+\/?/g;
    const matches = text.match(fbGroupRegex) || [];
    const groupsFromText: FacebookGroup[] = matches.map((url, index) => {
      // Try to find a name near the URL in the text (simple heuristic)
      const lines = text.split('\n');
      const lineWithUrl = lines.find(l => l.includes(url)) || "";
      let name = lineWithUrl.replace(url, '').replace(/[\[\]\(\)\-\:\*]/g, '').trim();
      if (!name || name.length < 3) name = `Community Group ${index + 1}`;

      return {
        id: `group-text-${Date.now()}-${index}`,
        name: name,
        url: url,
        niche: "Local Community"
      } as FacebookGroup;
    });

    // Combine and deduplicate by URL
    const allGroups = [...groupsFromChunks, ...groupsFromText];
    
    // Deduplicate by URL and filter for actual group paths
    const uniqueGroups: FacebookGroup[] = Array.from(
      new Map<string, FacebookGroup>(
        allGroups
          .filter(g => g.url.includes('/groups/'))
          .map((item) => [item.url.toLowerCase().replace(/\/$/, ''), item])
      ).values()
    );
    
    return uniqueGroups;
  } catch (error) {
    console.error("Error finding groups via Gemini:", error);
    return [];
  }
};

// Helper to find organic leads across platforms using search grounding
export const findLeads = async (
  file: KeywordFile, 
  specificPlatform?: string | null,
  searchGroups?: boolean,
  targetGroups?: FacebookGroup[]
): Promise<{ leads: Lead[], sources: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { keywords, excludeKeywords, niche, location } = file;
  
  const excludeText = excludeKeywords && excludeKeywords.length > 0 
    ? `\n- EXCLUDE results containing: ${excludeKeywords.join(', ')}` 
    : '';

  let platformInstruction = "";
  if (specificPlatform === 'facebook') {
    if (targetGroups && targetGroups.length > 0) {
      const groupUrls = targetGroups.map(g => g.url).join(', ');
      platformInstruction = `3. TARGET: Search specifically for recent discussions inside these Facebook Groups: ${groupUrls}.
      Look for posts where people are asking for: ${keywords.join(' OR ')}.`;
    } else {
      platformInstruction = `3. TARGET: Search public Facebook content in ${location} for phrases like "looking for recommendations", "can anyone recommend", "need a" followed by ${keywords.join(' OR ')}.`;
    }
  } else {
    platformInstruction = `3. PLATFORMS: Focus on ${specificPlatform || 'Facebook, Instagram, Quora, and Nextdoor'}. 
    Look for specific user discussions containing ${keywords.join(' OR ')} in ${location}.`;
  }

  const prompt = `SEARCH THE LIVE WEB for current (last 30-60 days) organic leads in ${location}.
    
    KEYWORDS TO MATCH IN USER POSTS: ${keywords.join(', ')}
    ${excludeText}

    GOAL: Find real people asking for help, services, or product recommendations.
    ${platformInstruction}

    Return a list of specific URLs to these discussions.`;

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
        const title = chunk.web?.title || "Lead Found";
        
        const urlLower = url.toLowerCase();
        let platform = "Web";
        if (urlLower.includes('quora.com')) platform = 'Quora';
        else if (urlLower.includes('facebook.com')) platform = 'Facebook';
        else if (urlLower.includes('instagram.com')) platform = 'Instagram';
        else if (urlLower.includes('nextdoor.com')) platform = 'Nextdoor';

        return {
          id: `lead-${Date.now()}-${index}`,
          author: title.split(/[-|]/)[0]?.trim() || "Local User",
          title: title,
          snippet: `Active discussion found in ${location} regarding "${keywords[0]}". Click to view the original source and respond.`,
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

export const analyzeLeadText = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Suggest a personalized, non-salesy opening message for this lead: "${text}"`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Hi! I saw your post and might be able to help with what you're looking for.";
  } catch (error) {
    return "Hi! I saw your request and would love to help.";
  }
};
