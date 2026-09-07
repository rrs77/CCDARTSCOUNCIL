import {
  Award,
  Blocks,
  BookOpen,
  FileText,
  GitBranch,
  GraduationCap,
  Lightbulb,
  Music2,
  Network,
  PencilRuler,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const STAGE_ICONS: Record<string, LucideIcon> = {
  eyfs: Blocks,
  "primary-ks1-ks2": PencilRuler,
  secondary: BookOpen,
  gcse: Award,
  "a-level": GitBranch,
  "university-he": GraduationCap,
  "music-hubs-and-national-centre": Music2,
  "a-solution": Network,
  sources: FileText,
  title: Lightbulb,
};

export function StageIconBadge({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const Icon = STAGE_ICONS[id] ?? Lightbulb;
  return (
    <span className={`stage-icon-badge ${className}`.trim()} aria-hidden>
      <Icon strokeWidth={2.1} />
    </span>
  );
}