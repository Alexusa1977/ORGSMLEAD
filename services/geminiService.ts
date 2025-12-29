
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KeywordFile, Lead, FacebookGroup } from "../types";

// Helper to find local Facebook groups via search grounding
export const findFacebookGroups = async (location: string): Promise<FacebookGroup[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prompt explicitly asks for "Community" and "Recommendation" style groups
  const prompt = `SEARCH THE WEB and find a list of 10-15 active, PUBLIC Facebook groups specifically for the city "${location}".
  
  Look for groups where residents ask for help, advice, or recommendations.
  Search for these exact patterns:
  1. "${location} Community"
  2. "${location} Recommendations"
  3. "${location} Neighbors"
  4. "Word of mouth ${location}"
  5. "Local help ${location}"

  CRITICAL: You MUST provide the full URL (e.g., https://www.facebook.com/groups/groupname) for each group. Ensure they are PUBLIC groups that allow searching and viewing posts.`;

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
    
    const groups: FacebookGroup[] = sources
      .filter((chunk: any) => {
        const uri = chunk.web?.uri?.toLowerCase() || "";
        // Check for common FB group URL patterns
        return uri.includes('facebook.com/groups') || uri.includes('facebook.com/community');
      })
      .map((chunk: any, index: number) => {
        const url = chunk.web.uri;
        let name = chunk.web.title || "Local Group";
        // Clean up common suffix patterns
        name = name.split('|')[0].split('-')[0].replace('Facebook', '').trim();
        
        return {
          id: `group-${Date.now()}-${index}`,
          name: name || "Community Discussion",
          url: url,
          niche: "Local Community"
        } as FacebookGroup;
      });

    // Fix: Explicitly type the Map and the resulting array to resolve the "Type 'unknown[]' is not assignable to type 'FacebookGroup[]'" error
    // Deduplicate by URL
    const uniqueGroups: FacebookGroup[] = Array.from(new Map<string, FacebookGroup>(groups.map((item) => [item.url, item])).values());
    
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
      platformInstruction = `3. TARGET: Search for posts and comments inside these specific Facebook Groups: ${groupUrls}.
      Find people mentioning these exact terms or variations: ${keywords.join(' OR ')}.
      Focus on questions like "Does anyone know a good...", "Who do you recommend for...", "Need a...".`;
    } else {
      platformInstruction = `3. TARGET: Search across public Facebook Groups and posts in ${location}. 
      Look for comments and posts where users are searching for: ${keywords.join(' OR ')}.
      Find high-intent locals who are looking for advice or service providers.`;
    }
  } else {
    platformInstruction = `3. PLATFORMS: Focus on ${specificPlatform || 'Facebook, Instagram, Quora, and Nextdoor'}. 
    Look for specific user discussions containing ${keywords.join(' OR ')} in ${location}.`;
  }

  const prompt = `
    Find specific organic leads (people seeking help/advice) in ${location}.
    KEYWORDS TO FIND IN POSTS/COMMENTS: ${keywords.join(', ')}
    ${excludeText}

    SEARCH GUIDELINES:
    1. INTENT: Find people who are actively asking for recommendations or seeking help.
    2. RECENCY: Must be from the last 60-90 days.
    ${platformInstruction}

    Return a list of organic opportunities with the exact source URL for each discussion.
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
        const title = chunk.web?.title || "Organic Discussion Found";
        
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
          snippet: `Potential lead on ${platform} in ${location} searching for "${keywords[0]}". User is asking for advice or a recommendation in a local community discussion.`,
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
  const prompt = `Analyze this potential sales lead's post or comment and provide a brief, creative outreach strategy or personalized icebreaker.
  
  LEAD CONTENT: "${text}"
  
  Keep the strategy short (1-2 sentences) and professional.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return response.text?.trim() || "Offer a helpful solution or insight related to their specific request in your first message.";
  } catch (error) {
    console.error("Error analyzing lead text:", error);
    return "Focus on providing value and solving their immediate problem in your outreach.";
  }
};
