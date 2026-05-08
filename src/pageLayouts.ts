import type { ContentPage, PageLayoutConfig, PageLayoutPreset, PageLayoutTheme } from "./types";

export const PAGE_LAYOUT_PRESETS: Array<{ value: PageLayoutPreset; label: string; description: string }> = [
  { value: "auto", label: "Auto", description: "Use the default layout for this kind of page." },
  { value: "cover", label: "Cover", description: "Large headline treatment over full-bleed media." },
  { value: "spotlight", label: "Spotlight", description: "Hero media with strong editorial copy block." },
  { value: "split", label: "Split", description: "Balanced media and copy columns." },
  { value: "stack", label: "Stack", description: "Layer content vertically like a feature article." },
  { value: "quote", label: "Quote", description: "Minimal typographic layout for short editorial statements." }
];

export const PAGE_LAYOUT_THEMES: Array<{ value: PageLayoutTheme; label: string }> = [
  { value: "cool", label: "Cool" },
  { value: "warm", label: "Warm" },
  { value: "neutral", label: "Neutral" }
];

export const getPageDefaultLayoutPreset = (page: ContentPage): PageLayoutPreset => {
  switch (page.contentKind) {
    case "image":
    case "video":
      return "cover";
    case "text":
      return "quote";
    case "audio":
    case "file":
      return "split";
    default:
      return "stack";
  }
};

export const resolvePageLayout = (page: ContentPage): Required<PageLayoutConfig> => {
  const preset = page.layout?.preset === "auto" || !page.layout?.preset
    ? getPageDefaultLayoutPreset(page)
    : page.layout.preset;

  return {
    preset,
    theme: page.layout?.theme ?? "cool",
    kicker: page.layout?.kicker ?? getDefaultKicker(page),
    headline: page.layout?.headline ?? page.title,
    body: page.layout?.body ?? page.description,
  };
};

const getDefaultKicker = (page: ContentPage) => {
  switch (page.contentKind) {
    case "image":
      return "Gallery Feature";
    case "video":
      return "Motion Feature";
    case "audio":
      return "Audio Feature";
    case "text":
      return "Editorial Note";
    case "file":
      return "Reference Asset";
    default:
      return "Magazine Spread";
  }
};
