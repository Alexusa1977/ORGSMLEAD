
export interface KeywordFile {
  id: string;
  name: string;
  keywords: string[];
  excludeKeywords: string[];
  niche: string;
  location: string;
  createdAt: number;
}

export interface FacebookGroup {
  id: string;
  name: string;
  url: string;
  memberCount?: string;
  niche: string;
}

export interface PlatformConnection {
  platform: string;
  isConnected: boolean;
  accountName?: string;
  neighborhoodUrl?: string; // Specific for Nextdoor
  lastSyncedAt?: number;
}

export type LeadStatus = 'to_be_outreached' | 'outreached' | 'followed_up' | 'replied';

export interface Lead {
  id: string;
  author?: string;
  authorAvatar?: string;
  title: string;
  snippet: string;
  url: string;
  platform: string;
  relevanceScore: number;
  detectedAt: number;
  fileId: string;
  status: LeadStatus;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface SearchResult {
  leads: Lead[];
  sources: { title: string; uri: string }[];
}
