export type FlipbookSource = "asset" | "upload";
export type ContentKind = "magazine" | "pdf" | "image" | "video" | "audio" | "text" | "file";
export type PageLayoutPreset = "auto" | "cover" | "spotlight" | "split" | "stack" | "quote";
export type PageLayoutTheme = "cool" | "warm" | "neutral";
export type ContentBlockKind = "text" | "link" | "button" | "video";
export type VideoProvider = "vimeo";

export interface PageLayoutConfig {
  preset: PageLayoutPreset;
  theme?: PageLayoutTheme;
  kicker?: string;
  headline?: string;
  body?: string;
}

export interface ContentBlock {
  id: string;
  kind: ContentBlockKind;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  body?: string;
  url?: string;
  mediaUrl?: string;
}

export interface ContentPage {
  id: string;
  title: string;
  description: string;
  contentUrl: string;
  contentKind: Exclude<ContentKind, "magazine">;
  fileName: string;
  layout?: PageLayoutConfig;
  blocks?: ContentBlock[];
  mimeType?: string;
  sizeBytes?: number;
  provider?: VideoProvider;
  embedUrl?: string;
  externalUrl?: string;
  posterUrl?: string;
  durationSeconds?: number;
}

export interface FlipbookItem {
  id: string;
  title: string;
  description: string;
  contentUrl?: string;
  contentKind: ContentKind;
  fileName?: string;
  pages?: ContentPage[];
  coverImageUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  pageCount: number;
  source: FlipbookSource;
  createdAt: string;
}
