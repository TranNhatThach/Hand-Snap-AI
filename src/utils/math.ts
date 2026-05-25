export const rotatePoint = (px: number, py: number, cx: number, cy: number, angle: number) => {
  const dx = px - cx;
  const dy = py - cy;
  const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
  const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
  return { x: cx + rx, y: cy + ry };
};

export const mapCoords = (
  nx: number,
  ny: number,
  canvasWidth: number,
  canvasHeight: number,
  videoWidth: number,
  videoHeight: number
) => {
  const rx = 1.0 - nx; // mirror horizontally
  const ry = ny;
  
  const videoRatio = videoWidth / videoHeight;
  const canvasRatio = canvasWidth / canvasHeight;
  
  let canvasX = 0;
  let canvasY = 0;
  
  if (videoRatio > canvasRatio) {
    // Video is wider than canvas (cropped horizontally)
    const renderedWidth = canvasHeight * videoRatio;
    const horizontalOffset = (renderedWidth - canvasWidth) / 2;
    canvasX = rx * renderedWidth - horizontalOffset;
    canvasY = ry * canvasHeight;
  } else {
    // Video is taller than canvas (cropped vertically)
    const renderedHeight = canvasWidth / videoRatio;
    const verticalOffset = (renderedHeight - canvasHeight) / 2;
    canvasX = rx * canvasWidth;
    canvasY = ry * renderedHeight - verticalOffset;
  }
  
  return { x: canvasX, y: canvasY };
};
