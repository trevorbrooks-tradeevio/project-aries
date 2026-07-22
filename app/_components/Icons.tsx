/* Geometric line icons — hand-built to match Tradeevio's SVG iconography.
   ~1.7px stroke, square joins. */
import type { SVGProps } from "react";

export type IconName =
  | "List" | "Notes" | "Calendar" | "Quote" | "Goal" | "Search" | "Gear" | "Plus"
  | "Drag" | "ChevL" | "ChevR" | "Check" | "Sun" | "Moon" | "Edit" | "Trash"
  | "Pin" | "Archive" | "X" | "ChevD" | "Grid";

export type IconProps = { size?: number; style?: SVGProps<SVGSVGElement>["style"]; className?: string };
type IconComponent = (props: IconProps) => React.ReactElement;

function ico(paths: React.ReactNode, viewBox = "0 0 24 24"): IconComponent {
  return function IconImpl({ size = 20, style, className }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="square"
        strokeLinejoin="miter"
        style={style}
        className={className}
        aria-hidden="true"
      >
        {paths}
      </svg>
    );
  };
}

export const Icons: Record<IconName, IconComponent> = {
  List: ico(
    <>
      <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" />
      <path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" />
    </>
  ),
  Grid: ico(
    <>
      <rect x={4} y={4} width={7} height={7} /><rect x={13} y={4} width={7} height={7} />
      <rect x={4} y={13} width={7} height={7} /><rect x={13} y={13} width={7} height={7} />
    </>
  ),
  Notes: ico(
    <>
      <path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" />
      <path d="M9 12h7" /><path d="M9 16h7" />
    </>
  ),
  Calendar: ico(
    <>
      <rect x={3.5} y={5} width={17} height={15} /><path d="M3.5 9h17" />
      <path d="M8 3v4" /><path d="M16 3v4" />
    </>
  ),
  Quote: ico(
    <>
      <path d="M10 7H5v6h5v-2H7.5v-2H10z" /><path d="M19 7h-5v6h5v-2h-2.5v-2H19z" />
    </>
  ),
  Goal: ico(
    <>
      <circle cx={12} cy={12} r={8} /><circle cx={12} cy={12} r={4.5} />
      <circle cx={12} cy={12} r={1} fill="currentColor" stroke="none" />
    </>
  ),
  Search: ico(<><circle cx={11} cy={11} r={6} /><path d="M20 20l-4-4" /></>),
  Gear: ico(
    <>
      <circle cx={12} cy={12} r={3} />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  Plus: ico(<path d="M12 5v14M5 12h14" />),
  Drag: ico(
    <>
      <circle cx={9} cy={6} r={1} /><circle cx={9} cy={12} r={1} /><circle cx={9} cy={18} r={1} />
      <circle cx={15} cy={6} r={1} /><circle cx={15} cy={12} r={1} /><circle cx={15} cy={18} r={1} />
    </>
  ),
  ChevL: ico(<path d="M15 5l-7 7 7 7" />),
  ChevR: ico(<path d="M9 5l7 7-7 7" />),
  Check: ico(<path d="M4 12l5 5L20 6" />),
  Sun: ico(
    <>
      <circle cx={12} cy={12} r={4} />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
    </>
  ),
  Moon: ico(<path d="M20 14a8 8 0 1 1-10-10 6 6 0 0 0 10 10z" />),
  Edit: ico(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M14 6l4 4" /></>),
  Trash: ico(
    <>
      <path d="M4 7h16" /><path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </>
  ),
  Pin: ico(<><path d="M9 3h6l-1 6 4 3v2H7v-2l4-3-1-6z" /><path d="M12 16v5" /></>),
  Archive: ico(
    <>
      <rect x={3.5} y={4} width={17} height={4} /><path d="M5 8v12h14V8" />
      <path d="M10 12h4" />
    </>
  ),
  X: ico(<path d="M6 6l12 12M18 6L6 18" />),
  ChevD: ico(<path d="M6 9l6 6 6-6" />),
};

export function Icon({ name, ...props }: { name: IconName } & IconProps) {
  const C = Icons[name];
  return <C {...props} />;
}
