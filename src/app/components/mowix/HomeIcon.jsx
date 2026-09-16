import {
  Award,
  BadgeEuro,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Camera,
  CalendarSync,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CircleArrowRight,
  CircleCheck,
  CirclePlay,
  HandCoins,
  Handshake,
  HardHat,
  HeartHandshake,
  Hammer,
  House,
  KeyRound,
  Landmark,
  MessageCircle,
  MessageSquareQuote,
  PaintRoller,
  RefreshCw,
  Route,
  Scale,
  Star,
  Tags,
  Users,
  WalletCards,
} from "lucide-react";

const HOME_ICONS = {
  about: Users,
  apartmentPurchase: Building2,
  arrowRight: CircleArrowRight,
  budgetCheck: Calculator,
  bankComparison: Landmark,
  blog: BookOpen,
  building: Building2,
  businessFinancing: BriefcaseBusiness,
  construction: HardHat,
  check: CircleCheck,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  experience: Award,
  facebook: MessageCircle,
  financing: HandCoins,
  fundingAdvice: BadgeEuro,
  homePurchase: House,
  housing: House,
  instagram: Camera,
  key: KeyRound,
  overview: ChartNoAxesCombined,
  personalSupport: Handshake,
  process: Route,
  projectRenovation: Hammer,
  renovation: PaintRoller,
  refinancing: RefreshCw,
  satisfaction: HeartHandshake,
  scheduledFinancing: CalendarSync,
  star: Star,
  tag: Tags,
  testimonials: MessageSquareQuote,
  rateComparison: Scale,
  wallet: WalletCards,
  youtube: CirclePlay,
  "eicon-star": Star,
  "fas-building": Building2,
  "fas-leaf": House,
  "fas-snowflake": House,
  "fas-tree": RefreshCw,
};

const CARD_ICON_STYLE = {
  color: "var(--e-global-color-b7f3b2e, #102a43)",
  height: "64px",
  width: "64px",
};

const NAVY_ICON_STYLE = {
  color: "var(--e-global-color-b7f3b2e, #102a43)",
};

export default function HomeIcon({ name, variant, className = "", style, ...props }) {
  const LucideIcon = HOME_ICONS[name];

  if (!LucideIcon) return null;

  return (
    <LucideIcon
      aria-hidden="true"
      className={`e-font-icon-svg e-lucide-${name} ${className}`.trim()}
      strokeWidth={2}
      style={{
        fill: "none",
        ...(variant === "card" ? CARD_ICON_STYLE : {}),
        ...(variant === "navy" ? NAVY_ICON_STYLE : {}),
        ...style,
      }}
      {...props}
    />
  );
}
