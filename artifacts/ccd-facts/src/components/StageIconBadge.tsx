import {
  Award,
  Blocks,
  BookOpen,
  Compass,
  FileText,
  GitBranch,
  GraduationCap,
  Landmark,
  Lightbulb,
  MapPin,
  Music2,
  Network,
  PencilRuler,
  type LucideIcon,
} from "lucide-react";

const STAGE_ICONS: Record<string, LucideIcon> = {
  eyfs: Blocks,
  "enrichment-framework": Compass,
  "primary-ks1-ks2": PencilRuler,
  secondary: BookOpen,
  gcse: Award,
  "a-level": GitBranch,
  "cold-spots-place-and-income": MapPin,
  "university-he": GraduationCap,
  "music-hubs-and-national-centre": Music2,
  "national-plans-and-free-resources": Landmark,
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