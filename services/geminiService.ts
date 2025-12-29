
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeywordFile, Lead, FacebookGroup } from "../types";

/**
 * Robust Facebook Group Discovery
 * Uses targeted search queries to find active public communities.
 */
export const findFacebookGroups = async (location: string): Promise<FacebookGroup[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Perform a deep search for PUBLIC Facebook Groups related to "${location}".
  I need groups where people ask for local recommendations, community help, or business referrals.
  
  Target patterns: 
  - "site:facebook.com/groups/ ${location} recommendations"
  - "site:facebook.com/groups/ ${location} community"
  - "site:facebook.com/groups/ ${location} word of mouth"
  
  Return the results as a list of group names and their full URLs (https://www.facebook.com/groups/...).
  Only provide groups that are currently active.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = response.text || "";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Extraction Pipeline: Chunks -> Text Regex -> Deduplication
    const foundGroups = new Map<string, FacebookGroup>();

    // Phase 1: Grounding Metadata
    sources.forEach((chunk: any, index: number) => {
      const uri = chunk.web?.uri;
      if (uri && uri.includes('facebook.com/groups/')) {
        const cleanUrl = uri.split('?')[0].replace(/\/$/, '');
        const name = chunk.web.title?.split('|')[0].trim() || "Community Group";
        foundGroups.set(cleanUrl.toLowerCase(), {
          id: `chunk-${Date.now()}-${index}`,
          name,
          url: cleanUrl,
          niche: "Local Community"
        });
      }
    });

    // Phase 2: Text Regex Fallback (Catches links Gemini mentions but doesn't "chunk")
    const fbRegex = /https?:\/\/(www\.)?facebook\.com\/groups\/[a-zA-Z0-9\.]+\/?/g;
    const matches = text.match(fbRegex) || [];
    matches.forEach((url, index) => {
      const cleanUrl = url.split('?')[0].replace(/\/$/, '');
      if (!foundGroups.has(cleanUrl.toLowerCase())) {
        foundGroups.set(cleanUrl.toLowerCase(), {
          id: `text-${Date.now()}-${index}`,
          name: "Discovered Group",
          url: cleanUrl,
          niche: "Local Community"
        });
      }
    });

    return Array.from(foundGroups.values());
  } catch (error) {
    console.error("Discovery Error:", error);
    return [];
  }
};

/**
 * Advanced Lead Monitoring
 * Uses specific search operators to find recent organic intent.
 */
export const findLeads = async (
  file: KeywordFile, 
  specificPlatform?: string | null,
  searchGroups?: boolean,
  targetGroups?: FacebookGroup[]
): Promise<{ leads: Lead[], sources: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { keywords, excludeKeywords, location } = file;
  
  // Construct aggressive search queries
  const positiveQueries = keywords.map(k => `"${k}"`).join(' OR ');
  const negativeQueries = excludeKeywords.length > 0 ? excludeKeywords.map(k => `-"${k}"`).join(' ') : '';
  
  let searchStrategy = "";
  if (specificPlatform === 'facebook' && targetGroups && targetGroups.length > 0) {
    // Search specific group subdirectories
    const siteLimits = targetGroups.slice(0, 3).map(g => {
      const groupPath = g.url.split('facebook.com')[1];
      return `site:facebook.com${groupPath}`;
    }).join(' OR ');
    searchStrategy = `Focus on finding RECENT posts (last 30 days) within these specific areas: ${siteLimits}. Look for: ${positiveQueries} ${negativeQueries}`;
  } else {
    // Broad platform search
    const site = specificPlatform ? `site:${specificPlatform}.com` : '(site:facebook.com OR site:quora.com OR site:reddit.com OR site:nextdoor.com)';
    searchStrategy = `${site} "${location}" (${positiveQueries}) ${negativeQueries} "recommendations" OR "looking for" OR "anyone know"`;
  }

  const prompt = `SEARCH THE LIVE WEB FOR ORGANIC LEADS.
  
  STRATEGY: ${searchStrategy}
  
  I am looking for real people (not businesses) asking for help or services.
  CRITICAL: You must extract and return the DIRECT URL to each specific post, comment thread, or discussion found. 
  
  If the search tool returns snippets, analyze them carefully to ensure they match the intent of "${keywords.join(', ')}".`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Low temperature for accuracy
      },
    });

    const text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const foundLeads = new Map<string, Lead>();

    // Extraction Phase 1: Grounding
    chunks.forEach((chunk: any, index: number) => {
      if (chunk.web?.uri) {
        const url = chunk.web.uri;
        const platform = url.includes('facebook') ? 'Facebook' : url.includes('quora') ? 'Quora' : 'Web';
        foundLeads.set(url.toLowerCase(), {
          id: `lead-c-${Date.now()}-${index}`,
          author: chunk.web.title?.split('-')[0].trim() || "User",
          title: chunk.web.title || "Organic Lead Found",
          snippet: `Found a match for your keywords in ${location}. This discussion appears to be a high-intent request for services.`,
          url: url,
          platform: platform,
          relevanceScore: 92,
          detectedAt: Date.now(),
          fileId: file.id,
          status: 'to_be_outreached'
        });
      }
    });

    // Extraction Phase 2: Regex Fallback for URLs in text
    const urlRegex = /https?:\/\/[^\s$.?#].[^\s]*/g;
    const textUrls = text.match(urlRegex) || [];
    textUrls.forEach((url, index) => {
      // Filter for platform URLs
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('facebook.com') || lowerUrl.includes('quora.com') || lowerUrl.includes('reddit.com')) {
        const cleanUrl = url.replace(/[.,)]+$/, '');
        if (!foundLeads.has(cleanUrl.toLowerCase())) {
          foundLeads.set(cleanUrl.toLowerCase(), {
            id: `lead-t-${Date.now()}-${index}`,
            author: "Discussion Participant",
            title: "New Opportunity Found",
            snippet: "Direct link extracted from search analysis matching your monitoring keywords.",
            url: cleanUrl,
            platform: cleanUrl.includes('facebook') ? 'Facebook' : 'Web',
            relevanceScore: 88,
            detectedAt: Date.now(),
            fileId: file.id,
            status: 'to_be_outreached'
          });
        }
      }
    });

    return { 
      leads: Array.from(foundLeads.values()), 
      sources: chunks 
    };
  } catch (error) {
    console.error("Lead Scan Error:", error);
    return { leads: [], sources: [] };
  }
};

export const analyzeLeadText = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Based on this lead text: "${text}", write a short, empathetic outreach message. 
  Rules: No sales pitch, no links, just a helpful "I saw you were looking for X, I might be able to help or point you in the right direction" vibe.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Hi! I noticed your post and wanted to see if I could help with what you're looking for.";
  } catch (error) {
    return "Hi! I saw your request and would love to help.";
  }
};
