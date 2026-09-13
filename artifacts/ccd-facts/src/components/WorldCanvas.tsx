import { SlideNav } from "@/components/SlideNav";
import { SectionFrame } from "@/components/SectionFrame";
import { StageOverview } from "@/components/StageOverview";
import { getFrame, type Presentation } from "@/content/layoutPresentation";

/**
 * Overview = index cards. Focus = one large readable slide, with prev/next and jump.
 */
export function WorldCanvas({
  presentation,
  focusedId,
  viewMode,
  canPrev,
  canNext,
  onFocus,
  onOpenDetail,
  onOpenChild,
  onPrev,
  onNext,
}: {
  presentation: Presentation;
  focusedId: string | null;
  viewMode: "overview" | "frame";
  reduced?: boolean;
  canPrev: boolean;
  canNext: boolean;
  viewport: { w: number; h: number };
  onOverview: () => void;
  onFocus: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onOpenChild?: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const hubs = presentation.frames.filter((f) => !f.parentId);
  const focusFrame = focusedId ? getFrame(presentation, focusedId) : null;
  const activeHubId = focusFrame?.mainSectionId || focusFrame?.id || null;
  const jumpItems = hubs.map((hub) => ({ id: hub.id, title: hub.title }));

  if (viewMode === "overview" || !focusFrame) {
    return (
      <div className="world-stage world-stage--overview-grid">
        <StageOverview stages={hubs} onOpen={onFocus} />
      </div>
    );
  }

  return (
    <div className="world-stage facts-slide-stage" aria-label={focusFrame.title}>
      <SectionFrame
        frame={focusFrame}
        presentation={presentation}
        highlighted
        density="focus"
        activeChildId={null}
        layout="scene"
        onOpen={() => onOpenDetail(focusFrame.id)}
        onOpenDetail={() => onOpenDetail(focusFrame.id)}
        onOpenChild={onOpenChild}
      />
      <div className="world-chrome">
        <SlideNav
          items={jumpItems}
          currentId={activeHubId}
          canPrev={canPrev}
          canNext={canNext}
          onPrev={onPrev}
          onNext={onNext}
          onJump={onFocus}
        />
      </div>
    </div>
  );
}
