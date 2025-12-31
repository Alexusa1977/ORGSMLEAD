
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { KeywordFile, Lead, FacebookGroup } from "../types";

/**
 * Normalizes Facebook URLs to ensure they are well-formed and accessible.
 * Ensures 'www.' prefix and removes trailing punctuation common in AI outputs.
 */
const normalizeFacebookUrl = (url: string): string => {
  let cleaned = url.trim();
  
  // Remove trailing punctuation that might have been caught by regex or AI text
  cleaned = cleaned.replace(/[.,)\]!?;:]+$/, '');
  
  // Ensure protocol
  if (!cleaned.startsWith('http')) {
    cleaned = 'https://' + cleaned;
  }
  
  try {
    const urlObj = new URL(cleaned);
    
    // Force www.facebook.com instead of m.facebook.com or mobile.facebook.com
    if (urlObj.hostname.includes('facebook.com')) {
      urlObj.hostname = 'www.facebook.com';
    }
    
    // Remove tracking parameters often added by FB or search engines
    const params = ['__cft__[0]', '__tn__', 'ref', 'extid', 'mibextid', 'rdid'];
    params.forEach(p => urlObj.searchParams.delete(p));
    
    return urlObj.toString();
  } catch (e) {
    return cleaned;
  }
};

/**
 * Robust Facebook Group Discovery
 */
export const findFacebookGroups = async (location: string): Promise<FacebookGroup[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Perform a deep search for PUBLIC Facebook Groups related to "${location}".
  I need groups where people ask for local recommendations, community help, or business referrals.
  
  Target patterns: 
  - "site:facebook.com/groups/ ${location} recommendations"
  - "site:facebook.com/groups/ ${location} community"
  
  Return the results as a list of group names and their full URLs.`;

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
    
    const foundGroups = new Map<string, FacebookGroup>();

    sources.forEach((chunk: any, index: number) => {
      const uri = chunk.web?.uri;
      if (uri && uri.includes('facebook.com/groups/')) {
        const cleanUrl = normalizeFacebookUrl(uri);
        const name = chunk.web.title?.split('|')[0].trim() || "Community Group";
        foundGroups.set(cleanUrl.toLowerCase(), {
          id: `chunk-${Date.now()}-${index}`,
          name,
          url: cleanUrl,
          niche: "Local Community"
        });
      }
    });

    const fbRegex = /https?:\/\/(?:www\.)?facebook\.com\/groups\/[a-zA-Z0-9\._-]+\/?/g;
    const matches = text.match(fbRegex) || [];
    matches.forEach((url, index) => {
      const cleanUrl = normalizeFacebookUrl(url);
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
 * Extracts a preview of comments/discussion from a specific URL.
 */
export const fetchThreadPreview = async (url: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analyze the conversation at this URL: ${url}. 
  I need a preview of the discussion. Extract 2-3 relevant comments, replies, or specific details mentioned in the thread.
  If you cannot find specific comments, summarize the general sentiment and key points discussed.
  
  Format the output as a simple JSON array of strings.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
    });

    const result = JSON.parse(response.text || "[]");
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Thread Preview Error:", error);
    return ["Unable to load live comments at this moment. Click 'View Source' to see the full post on the platform."];
  }
};

/**
 * Advanced Lead Monitoring
 */
export const findLeads = async (
  file: KeywordFile, 
  specificPlatform?: string | null,
  searchGroups?: boolean,
  targetGroups?: FacebookGroup[]
): Promise<{ leads: Lead[], sources: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { keywords, excludeKeywords, location } = file;
  
  const positiveQueries = keywords.map(k => `"${k}"`).join(' OR ');
  const negativeQueries = excludeKeywords.length > 0 ? excludeKeywords.map(k => `-"${k}"`).join(' ') : '';
  
  let searchStrategy = "";
  if (specificPlatform === 'facebook' && targetGroups && targetGroups.length > 0) {
    const siteLimits = targetGroups.slice(0, 3).map(g => {
      const groupPath = g.url.split('facebook.com')[1];
      return `site:facebook.com${groupPath}`;
    }).join(' OR ');
    searchStrategy = `Focus on finding RECENT posts (last 30 days) within these specific areas: ${siteLimits}. Look for: ${positiveQueries} ${negativeQueries}`;
  } else if (specificPlatform === 'nextdoor') {
    searchStrategy = `site:nextdoor.com "${positiveQueries}" ${negativeQueries} "recommendation" OR "neighbor" OR "looking for". CONTEXT: ${location}`;
  } else {
    const site = specificPlatform ? `site:${specificPlatform}.com` : '(site:facebook.com OR site:quora.com OR site:reddit.com OR site:nextdoor.com)';
    searchStrategy = `${site} "${location}" (${positiveQueries}) ${negativeQueries} "recommendations" OR "looking for" OR "anyone know"`;
  }

  const prompt = `SEARCH THE LIVE WEB FOR ORGANIC LEADS.
  
  STRATEGY: ${searchStrategy}
  
  I am looking for real people (not businesses) asking for help or services.
  CRITICAL: You must extract and return the DIRECT URL to each specific post, comment thread, or discussion found.`;

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
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const foundLeads = new Map<string, Lead>();

    chunks.forEach((chunk: any, index: number) => {
      if (chunk.web?.uri) {
        let url = chunk.web.uri;
        let platform = 'Web';
        
        if (url.includes('facebook.com')) {
          url = normalizeFacebookUrl(url);
          platform = 'Facebook';
        } else if (url.includes('quora')) platform = 'Quora';
        else if (url.includes('nextdoor')) platform = 'Nextdoor';
        else if (url.includes('reddit')) platform = 'Reddit';

        foundLeads.set(url.toLowerCase(), {
          id: `lead-c-${Date.now()}-${index}`,
          author: chunk.web.title?.split('-')[0].trim() || "User",
          title: chunk.web.title || "Organic Lead Found",
          snippet: `Found a match for your keywords. This discussion appears to be a high-intent request for services.`,
          url: url,
          platform: platform,
          relevanceScore: 92,
          detectedAt: Date.now(),
          fileId: file.id,
          status: 'to_be_outreached'
        });
      }
    });

    const urlRegex = /https?:\/\/[^\s$.?#][^\s]*[a-zA-Z0-9\/]/g;
    const textUrls = text.match(urlRegex) || [];
    textUrls.forEach((url, index) => {
      let cleanUrl = url;
      if (url.includes('facebook.com')) {
        cleanUrl = normalizeFacebookUrl(url);
      }
      
      const lowerUrl = cleanUrl.toLowerCase();
      if (lowerUrl.includes('facebook.com') || lowerUrl.includes('quora.com') || lowerUrl.includes('reddit.com') || lowerUrl.includes('nextdoor.com')) {
        if (!foundLeads.has(lowerUrl)) {
          let platform = 'Web';
          if (lowerUrl.includes('facebook')) platform = 'Facebook';
          else if (lowerUrl.includes('nextdoor')) platform = 'Nextdoor';
          else if (lowerUrl.includes('quora')) platform = 'Quora';

          foundLeads.set(lowerUrl, {
            id: `lead-t-${Date.now()}-${index}`,
            author: "Discussion Participant",
            title: "New Opportunity Found",
            snippet: "Direct link extracted from search analysis matching your monitoring keywords.",
            url: cleanUrl,
            platform: platform,
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
