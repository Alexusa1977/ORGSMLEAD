
export interface KeywordFile {
  id: string;
  name: string;
  keywords: string[];
  excludeKeywords: string[];
  niche: string;
  location: string;
  createdAt: number;
}

export interface Lead {
  id: string;
  title: string;
  snippet: string;
  url: string;
  platform: string;
  relevanceScore: number;
  detectedAt: number;
  fileId: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface SearchResult {
  leads: Lead[];
  sources: { title: string; uri: string }[];
}
