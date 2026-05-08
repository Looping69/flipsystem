import React from "react";
import { ExternalLink, Grip, Link2, Plus, SquareStack, Type, Video, Trash2 } from "lucide-react";
import { getContentLabel } from "../content";
import { resolvePageLayout } from "../pageLayouts";
import type { ContentBlock, ContentBlockKind, ContentPage } from "../types";

type PageDesignEditorProps = {
  page: ContentPage;
  onUpdatePage: (pageId: string, updater: (page: ContentPage) => ContentPage) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const makeBlockId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `block-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
};

const createBlock = (kind: ContentBlockKind, page: ContentPage): ContentBlock => {
  switch (kind) {
    case "text":
      return {
        id: makeBlockId(),
        kind,
        x: 8,
        y: 10,
        width: 36,
        height: 18,
        label: "Text block",
        body: "Add a short supporting message."
      };
    case "link":
      return {
        id: makeBlockId(),
        kind,
        x: 10,
        y: 72,
        width: 28,
        height: 12,
        label: "Open link",
        url: "https://"
      };
    case "button":
      return {
        id: makeBlockId(),
        kind,
        x: 42,
        y: 72,
        width: 24,
        height: 12,
        label: "Learn more",
        url: "https://"
      };
    case "video":
      return {
        id: makeBlockId(),
        kind,
        x: 56,
        y: 10,
        width: 30,
        height: 24,
        label: "Video block",
        body: "Optional linked video panel",
        mediaUrl: page.contentKind === "video" ? page.contentUrl : "",
        url: "https://"
      };
  }
};

export function PageDesignEditor({ page, onUpdatePage }: PageDesignEditorProps) {
  const layout = resolvePageLayout(page);
  const [selectedBlockId, setSelectedBlockId] = React.useState<string>(page.blocks?.[0]?.id ?? "");
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const dragRef = React.useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const blocks = page.blocks ?? [];
  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? null;
  const pageLabel = getContentLabel(page.contentKind);
  const themeClass = `page-theme-${layout.theme}`;
  const isMediaPage = page.contentKind === "image" || page.contentKind === "video";
  const isCoverLayout = layout.preset === "cover";
  const isSpotlightLayout = layout.preset === "spotlight";
  const isSplitLayout = layout.preset === "split";
  const isStackLayout = layout.preset === "stack";
  const isQuoteLayout = layout.preset === "quote";
  const isFullPageMedia = isMediaPage && (isCoverLayout || isSpotlightLayout);

  React.useEffect(() => {
    if (!selectedBlockId && blocks[0]) {
      setSelectedBlockId(blocks[0].id);
      return;
    }

    if (selectedBlockId && !blocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(blocks[0]?.id ?? "");
    }
  }, [blocks, selectedBlockId]);

  const patchSelectedBlock = (patch: Partial<ContentBlock>) => {
    if (!selectedBlock) {
      return;
    }

    onUpdatePage(page.id, (currentPage) => ({
      ...currentPage,
      blocks: (currentPage.blocks ?? []).map((block) => (block.id === selectedBlock.id ? { ...block, ...patch } : block))
    }));
  };

  const addBlock = (kind: ContentBlockKind) => {
    const nextBlock = createBlock(kind, page);
    onUpdatePage(page.id, (currentPage) => ({
      ...currentPage,
      blocks: [...(currentPage.blocks ?? []), nextBlock]
    }));
    setSelectedBlockId(nextBlock.id);
  };

  const removeSelectedBlock = () => {
    if (!selectedBlock) {
      return;
    }

    onUpdatePage(page.id, (currentPage) => ({
      ...currentPage,
      blocks: (currentPage.blocks ?? []).filter((block) => block.id !== selectedBlock.id)
    }));
  };

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>, blockId: string) => {
    const surface = surfaceRef.current;
    if (!surface) {
      return;
    }

    const block = blocks.find((entry) => entry.id === blockId);
    if (!block) {
      return;
    }

    const rect = surface.getBoundingClientRect();
    dragRef.current = {
      id: blockId,
      offsetX: event.clientX - rect.left - rect.width * (block.x / 100),
      offsetY: event.clientY - rect.top - rect.height * (block.y / 100)
    };
    setSelectedBlockId(blockId);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const surface = surfaceRef.current;
    const dragState = dragRef.current;
    if (!surface || !dragState) {
      return;
    }

    const block = blocks.find((entry) => entry.id === dragState.id);
    if (!block) {
      return;
    }

    const rect = surface.getBoundingClientRect();
    const nextX = clamp(((event.clientX - rect.left - dragState.offsetX) / rect.width) * 100, 0, 100 - block.width);
    const nextY = clamp(((event.clientY - rect.top - dragState.offsetY) / rect.height) * 100, 0, 100 - block.height);

    onUpdatePage(page.id, (currentPage) => ({
      ...currentPage,
      blocks: (currentPage.blocks ?? []).map((entry) =>
        entry.id === dragState.id ? { ...entry, x: nextX, y: nextY } : entry
      )
    }));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <div className="design-editor-shell">
      <div className="design-editor-toolbar">
        <div>
          <p className="panel-label">Live Canvas</p>
          <h3>{page.title}</h3>
          <p className="design-editor-copy">Drag blocks directly on the page. Use links and video cards for richer layouts.</p>
        </div>
        <div className="design-tool-actions">
          <button type="button" className="design-tool-btn" onClick={() => addBlock("text")}>
            <Type size={16} />
            <span>Text</span>
          </button>
          <button type="button" className="design-tool-btn" onClick={() => addBlock("link")}>
            <Link2 size={16} />
            <span>Link</span>
          </button>
          <button type="button" className="design-tool-btn" onClick={() => addBlock("button")}>
            <SquareStack size={16} />
            <span>Button</span>
          </button>
          <button type="button" className="design-tool-btn" onClick={() => addBlock("video")}>
            <Video size={16} />
            <span>Video</span>
          </button>
        </div>
      </div>

      <div className="design-editor-grid">
        <div className="design-editor-stage">
          <div
            ref={surfaceRef}
            className={`flip-page design-editor-page ${themeClass} ${isFullPageMedia ? "asset-cover-page" : ""}`}
            onPointerMove={handleDrag}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            <div className={`flip-page-frame mixed-page-frame layout-${layout.preset}`}>
              <div
                className={`mixed-page-layout ${themeClass} ${isSplitLayout ? "is-split" : ""} ${isSpotlightLayout ? "is-spotlight" : ""} ${isStackLayout ? "is-stack" : ""} ${isQuoteLayout ? "is-quote" : ""}`}
              >
                <div className="mixed-page-copy">
                  <span className="mixed-page-kicker">{layout.kicker}</span>
                  <h3>{layout.headline}</h3>
                  {layout.body ? <p className="mixed-page-body">{layout.body}</p> : null}
                </div>

                <div className="mixed-page-asset">
                  {page.contentKind === "image" ? <img className="mixed-image" src={page.contentUrl} alt={`${pageLabel} page`} /> : null}
                  {page.contentKind === "video" ? <video className="mixed-video" src={page.contentUrl} controls playsInline /> : null}
                  {page.contentKind === "audio" ? <audio className="mixed-audio" src={page.contentUrl} controls /> : null}
                </div>

                <div className="design-block-layer">
                  {blocks.map((block) => {
                    const active = block.id === selectedBlockId;
                    const style = {
                      left: `${block.x}%`,
                      top: `${block.y}%`,
                      width: `${block.width}%`,
                      minHeight: `${block.height}%`
                    };

                    return (
                      <div
                        key={block.id}
                        className={`design-block design-block-${block.kind} ${active ? "active" : ""}`}
                        style={style}
                        onPointerDown={(event) => beginDrag(event, block.id)}
                        onClick={() => setSelectedBlockId(block.id)}
                      >
                        <div className="design-block-handle">
                          <Grip size={14} />
                          <span>{block.kind}</span>
                        </div>

                        {block.kind === "text" ? (
                          <div className="design-block-copy">
                            <strong>{block.label || "Text"}</strong>
                            {block.body ? <p>{block.body}</p> : null}
                          </div>
                        ) : null}

                        {block.kind === "link" ? (
                          <a href={block.url || "#"} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                            <Link2 size={14} />
                            <span>{block.label || "Open link"}</span>
                          </a>
                        ) : null}

                        {block.kind === "button" ? (
                          <a href={block.url || "#"} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                            <span>{block.label || "Learn more"}</span>
                            <ExternalLink size={14} />
                          </a>
                        ) : null}

                        {block.kind === "video" ? (
                          <div className="design-video-card">
                            <div className="design-video-label">
                              <Video size={16} />
                              <span>{block.label || "Video block"}</span>
                            </div>
                            {block.mediaUrl ? <video src={block.mediaUrl} muted controls playsInline /> : <p>Add a video URL or use the page video.</p>}
                            {block.url ? (
                              <a href={block.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                                <span>{block.body || "Open linked destination"}</span>
                                <ExternalLink size={14} />
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  {blocks.length === 0 ? (
                    <div className="design-editor-empty">
                      <Plus size={18} />
                      <span>Add text, links, buttons, or video cards to this page.</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flip-page-number">{pageLabel}</div>
          </div>
        </div>

        <aside className="design-side-panel">
          <div className="design-panel-card">
            <label>Selected Block</label>
            {selectedBlock ? (
              <>
                <input
                  className="editor-input"
                  value={selectedBlock.label ?? ""}
                  placeholder="Label"
                  onChange={(event) => patchSelectedBlock({ label: event.target.value })}
                />
                <textarea
                  className="editor-input"
                  value={selectedBlock.body ?? ""}
                  placeholder="Supporting copy"
                  onChange={(event) => patchSelectedBlock({ body: event.target.value })}
                />
                {(selectedBlock.kind === "link" || selectedBlock.kind === "button" || selectedBlock.kind === "video") ? (
                  <input
                    className="editor-input"
                    value={selectedBlock.url ?? ""}
                    placeholder="https://"
                    onChange={(event) => patchSelectedBlock({ url: event.target.value })}
                  />
                ) : null}
                {selectedBlock.kind === "video" ? (
                  <input
                    className="editor-input"
                    value={selectedBlock.mediaUrl ?? ""}
                    placeholder="Video URL"
                    onChange={(event) => patchSelectedBlock({ mediaUrl: event.target.value })}
                  />
                ) : null}
                <div className="design-size-grid">
                  <div>
                    <label>X</label>
                    <input
                      className="editor-input"
                      type="number"
                      min={0}
                      max={100}
                      value={Math.round(selectedBlock.x)}
                      onChange={(event) => patchSelectedBlock({ x: clamp(Number(event.target.value), 0, 100 - selectedBlock.width) })}
                    />
                  </div>
                  <div>
                    <label>Y</label>
                    <input
                      className="editor-input"
                      type="number"
                      min={0}
                      max={100}
                      value={Math.round(selectedBlock.y)}
                      onChange={(event) => patchSelectedBlock({ y: clamp(Number(event.target.value), 0, 100 - selectedBlock.height) })}
                    />
                  </div>
                  <div>
                    <label>W</label>
                    <input
                      className="editor-input"
                      type="number"
                      min={12}
                      max={100}
                      value={Math.round(selectedBlock.width)}
                      onChange={(event) => patchSelectedBlock({ width: clamp(Number(event.target.value), 12, 100) })}
                    />
                  </div>
                  <div>
                    <label>H</label>
                    <input
                      className="editor-input"
                      type="number"
                      min={8}
                      max={100}
                      value={Math.round(selectedBlock.height)}
                      onChange={(event) => patchSelectedBlock({ height: clamp(Number(event.target.value), 8, 100) })}
                    />
                  </div>
                </div>
                <button type="button" className="cover-clear-btn design-remove-btn" onClick={removeSelectedBlock}>
                  <Trash2 size={14} />
                  <span>Remove block</span>
                </button>
              </>
            ) : (
              <p className="editor-hint">Select a block on the page, or add a new one from the toolbar.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
