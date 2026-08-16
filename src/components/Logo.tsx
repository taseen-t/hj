/**
 * House Job Portal mark — an original dot-cross: four satellite dots around an
 * emphasized center, forming a medical cross. Drawn on a 32x32 grid so it lines
 * up with the favicon and the PDF header.
 */
export const LOGO_DOTS = [
  { cx: 16, cy: 16, r: 5 }, // center (emphasized)
  { cx: 16, cy: 4.6, r: 3.5 }, // top
  { cx: 16, cy: 27.4, r: 3.5 }, // bottom
  { cx: 4.6, cy: 16, r: 3.5 }, // left
  { cx: 27.4, cy: 16, r: 3.5 }, // right
] as const;

export default function Logo({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill={color}
      aria-hidden="true"
      focusable="false"
    >
      {LOGO_DOTS.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} />
      ))}
    </svg>
  );
}
