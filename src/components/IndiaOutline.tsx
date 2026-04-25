// Simplified SVG outline of India for placeholder maps.
// Single path approximating mainland silhouette in a 600x700 viewBox.
interface Props {
  className?: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export const IndiaOutline = ({
  className,
  stroke = "currentColor",
  fill = "transparent",
  strokeWidth = 1.4,
  children,
}: Props) => (
  <svg viewBox="0 0 600 700" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M250 40 C 290 50, 330 55, 360 80 C 390 100, 410 120, 430 140 C 450 160, 470 180, 480 210 C 490 240, 495 270, 490 300 C 485 320, 475 340, 470 360 C 465 380, 460 400, 450 420 C 440 450, 420 480, 400 510 C 380 540, 360 570, 340 600 C 320 630, 300 650, 285 660 C 270 650, 255 620, 245 590 C 230 560, 215 530, 200 500 C 180 470, 160 440, 145 410 C 130 380, 120 350, 115 320 C 110 290, 115 260, 130 230 C 145 200, 165 170, 175 145 C 185 120, 200 95, 220 70 C 230 55, 240 45, 250 40 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    {children}
  </svg>
);
