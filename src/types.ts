export interface TranscriptSegment {
  id: string;
  speaker: 'Speaker A' | 'Speaker B';
  speakerLabel: string; // e.g. "Jordan (Sales Rep)" or "Alex (VP Engineering / Prospect)"
  role: 'rep' | 'prospect';
  timestamp: string; // e.g. "01:24"
  timeInSeconds: number;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  engagementScore: number; // 0 - 100
  intentTag?: 'Rapport' | 'Discovery' | 'Pain Point' | 'Objection' | 'Value Prop' | 'Pricing' | 'Closing' | 'Question';
}

export interface SentimentDataPoint {
  timeLabel: string; // e.g. "00:30"
  timeInSeconds: number;
  repEngagement: number; // 0 - 100
  prospectEngagement: number; // 0 - 100
  overallSentiment: number; // -50 to +50 or 0 to 100
  event?: string; // e.g. "Pricing sticker shock" or "ROI Case Study resonated"
  speaker: 'rep' | 'prospect' | 'both';
  transcriptSnippet?: string;
}

export interface CoachingItem {
  id: string;
  title: string;
  category: string; // e.g. "Active Listening", "Discovery Depth", "Objection Handling", "Closing Urgency"
  quote: string; // Evidence from transcript
  timestamp: string;
  timeInSeconds: number;
  analysis: string;
  actionableTip?: string; // What to do next or improved script
}

export interface CoachingCardData {
  overallScore: number; // 0 - 100
  talkListenRatio: {
    repPercent: number;
    prospectPercent: number;
    status: 'Optimal' | 'Rep Talking Too Much' | 'Prospect Silent';
  };
  pacingWpm: {
    repWpm: number;
    prospectWpm: number;
  };
  objectionHandlingScore: number;
  discoveryQualityScore: number;
  summary: string;
  thingsDoneWell: CoachingItem[]; // Exactly 3 things
  missedOpportunities: CoachingItem[]; // Exactly 3 things
  recommendedActionItems: string[];
}

export interface SalesCallAnalysis {
  id: string;
  title: string;
  prospectCompany: string;
  dealSize: string;
  callDate: string;
  durationSeconds: number;
  audioUrl?: string;
  transcript: TranscriptSegment[];
  sentimentTimeline: SentimentDataPoint[];
  coachingCard: CoachingCardData;
}

export interface SharedRoomMessage {
  id: string;
  senderName: string;
  senderId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  type: 'text' | 'document' | 'image' | 'video' | 'data' | 'link' | 'contact_info' | 'call_analysis' | 'file_transfer' | 'coaching_note';
  content?: string;
  url?: string;
  fileName?: string;
  fileSize?: string | number;
  fileData?: string; // base64 or download data uri
  fileType?: string; // mime type (pdf, docx, image, etc.)
  dataType?: 'json' | 'code' | 'text' | 'url' | 'credentials';
  contactInfo?: {
    name: string;
    phone?: string;
    email?: string;
    role?: string;
    note?: string;
  };
  analysisPayload?: SalesCallAnalysis;
  timestamp: string;
}

export interface RoomParticipant {
  id: string;
  name: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  isAdmin?: boolean;
  avatarColor?: string;
  joinedAt: string;
}

export interface RoomState {
  roomCode: string;
  participants: RoomParticipant[];
  messages: SharedRoomMessage[];
  maxMembers?: number; // 7 members max
  activeAnalysis?: SalesCallAnalysis | null;
}
