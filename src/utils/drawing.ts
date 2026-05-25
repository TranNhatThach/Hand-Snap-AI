import { mapCoords } from './math';

export const drawCornerBracket = (
  ctx: CanvasRenderingContext2D,
  pStart: { x: number; y: number },
  pNext1: { x: number; y: number },
  pNext2: { x: number; y: number }
) => {
  const dx1 = pNext1.x - pStart.x;
  const dy1 = pNext1.y - pStart.y;
  const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
  const b1 = Math.min(18, len1 * 0.25);
  const pt1 = { x: pStart.x + (dx1 / len1) * b1, y: pStart.y + (dy1 / len1) * b1 };
  
  const dx2 = pNext2.x - pStart.x;
  const dy2 = pNext2.y - pStart.y;
  const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
  const b2 = Math.min(18, len2 * 0.25);
  const pt2 = { x: pStart.x + (dx2 / len2) * b2, y: pStart.y + (dy2 / len2) * b2 };
  
  ctx.beginPath();
  ctx.moveTo(pt1.x, pt1.y);
  ctx.lineTo(pStart.x, pStart.y);
  ctx.lineTo(pt2.x, pt2.y);
  ctx.stroke();
};

export const drawOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  videoWidth: number,
  videoHeight: number,
  box: { cx: number; cy: number; theta: number; bw: number; bh: number } | null,
  hasTwoHands: boolean,
  hand1: any,
  hand2: any,
  countdownProgress: number,
  countdownStart: number | null,
  isStable: boolean
) => {
  ctx.clearRect(0, 0, width, height);

  let ptT1_screen = { x: 0, y: 0 };
  let ptI1_screen = { x: 0, y: 0 };
  let ptI2_screen = { x: 0, y: 0 };
  let ptT2_screen = { x: 0, y: 0 };

  // 1. If box is active, calculate screen vertices and draw prism mask cutout
  if (box && hasTwoHands && hand1 && hand2) {
    ptT1_screen = mapCoords(hand1[4].x, hand1[4].y, width, height, videoWidth, videoHeight);
    ptI1_screen = mapCoords(hand1[8].x, hand1[8].y, width, height, videoWidth, videoHeight);
    ptI2_screen = mapCoords(hand2[8].x, hand2[8].y, width, height, videoWidth, videoHeight);
    ptT2_screen = mapCoords(hand2[4].x, hand2[4].y, width, height, videoWidth, videoHeight);

    // Draw Colorful Prism Mask background overlay
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, 'rgba(255, 0, 128, 0.4)');     // Pink
    grad.addColorStop(0.3, 'rgba(0, 242, 254, 0.4)');    // Cyan
    grad.addColorStop(0.65, 'rgba(255, 215, 0, 0.35)');  // Gold
    grad.addColorStop(1, 'rgba(127, 0, 255, 0.4)');     // Purple
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Cutout the crop area (make it 100% transparent to show raw feed clearly)
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(ptT1_screen.x, ptT1_screen.y);
    ctx.lineTo(ptI1_screen.x, ptI1_screen.y);
    ctx.lineTo(ptI2_screen.x, ptI2_screen.y);
    ctx.lineTo(ptT2_screen.x, ptT2_screen.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 2. Draw finger connector lines & tip dots (so they draw on top of everything nicely)
  if (hasTwoHands && hand1 && hand2 && box) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2.5;

    // Draw crop box boundary lines
    ctx.beginPath();
    ctx.moveTo(ptT1_screen.x, ptT1_screen.y);
    ctx.lineTo(ptI1_screen.x, ptI1_screen.y); // left side (hand 1)
    ctx.lineTo(ptI2_screen.x, ptI2_screen.y); // top side (index to index)
    ctx.lineTo(ptT2_screen.x, ptT2_screen.y); // right side (hand 2)
    ctx.lineTo(ptT1_screen.x, ptT1_screen.y); // bottom side (thumb to thumb)
    ctx.closePath();
    ctx.stroke();

    // Draw tip dots (4 points)
    ctx.fillStyle = '#ffffff';
    [ptT1_screen, ptI1_screen, ptI2_screen, ptT2_screen].forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.restore();

    // 3. Draw modern corner brackets
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    drawCornerBracket(ctx, ptT1_screen, ptI1_screen, ptT2_screen);
    drawCornerBracket(ctx, ptI1_screen, ptT1_screen, ptI2_screen);
    drawCornerBracket(ctx, ptI2_screen, ptI1_screen, ptT2_screen);
    drawCornerBracket(ctx, ptT2_screen, ptT1_screen, ptI2_screen);
    ctx.restore();

    // 4. Draw countdown circle in the center of the crop area
    if (countdownProgress > 0) {
      const cx = (ptT1_screen.x + ptI1_screen.x + ptI2_screen.x + ptT2_screen.x) / 4;
      const cy = (ptT1_screen.y + ptI1_screen.y + ptI2_screen.y + ptT2_screen.y) / 4;
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (countdownProgress / 100) * 2 * Math.PI;

      // Circle Track
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, 2 * Math.PI);
      ctx.stroke();

      // Active countdown arc
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, 26, startAngle, endAngle);
      ctx.stroke();
      ctx.restore();

      // Digits text
      const elapsed = Date.now() - (countdownStart || 0);
      const remainingSec = Math.max(0, Math.ceil((2000 - elapsed) / 1000));
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(remainingSec.toString(), cx, cy);
      ctx.restore();

      // Stable state subtitle under the bottom center of the box
      ctx.save();
      const ptBottomCenter_screen = {
        x: (ptT1_screen.x + ptT2_screen.x) / 2,
        y: (ptT1_screen.y + ptT2_screen.y) / 2
      };

      const text = isStable ? "GIỮ YÊN..." : "ĐANG CỐ ĐỊNH...";
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, ptBottomCenter_screen.x, ptBottomCenter_screen.y + 22);
      ctx.restore();
    }
  } else {
    // Guide instructions if no frame is active
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '500 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Raise both hands to frame', width / 2, height / 2);
    ctx.restore();
  }
};
