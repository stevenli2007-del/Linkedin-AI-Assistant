export interface UserProfile {
  userName: string;
  userHeadline: string;
  userSchool: string;
  userCompany: string;
  userLocation: string;
  userBackground: string;
  userGoals: string;
  userInterests: string;
}

export interface TargetProfile {
  targetName: string;
  targetHeadline: string;
  targetSchool: string;
  targetCompany: string;
  targetLocation: string;
  targetAbout: string;
  targetExperience: string;
}

export interface PromptPayload {
  systemPrompt: string;
  userPrompt: string;
  generatedPrompt: string;
}

export type MessageStyle = "professional" | "friendly" | "entrepreneur" | "academic";

export interface GeneratedMessage {
  messageId: string;
  messageStyle: MessageStyle;
  messageContent: string;
  generatedTime: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  targetName: string;
  targetHeadline: string;
  targetCompany: string;
  messageStyle: MessageStyle;
  messageContent: string;
  commonPoint: string;
}
