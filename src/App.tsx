import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { rotatePoint } from './utils/math';
import { drawOverlay } from './utils/drawing';
import { PreviewModal } from './components/PreviewModal';
import './App.css';

declare global {
  interface Window {
    Hands: any;
  }
}

export default function App() {
  // Model and camera loading states
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Capture preview & shutter flash
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  // Refs for camera feeds
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Tracking references (prevents lag from React re-renders)
  const handsRef = useRef<any>(null);
  const loopActiveRef = useRef<boolean>(false);
  const pinchPointsRef = useRef<any[]>([]);
  
  // Custom Rotated Box structures
  const boxRef = useRef<{ cx: number; cy: number; theta: number; bw: number; bh: number } | null>(null);
  const stabilityHistoryRef = useRef<Array<{ cx: number; cy: number; theta: number; bw: number; bh: number }>>([]);
  const lastHandsRef = useRef<{ hand1: any; hand2: any } | null>(null);
  
  const countdownStartRef = useRef<number | null>(null);
  const countdownProgressRef = useRef<number>(0);
  const isStableRef = useRef<boolean>(false);

  // Step 1: Detect MediaPipe loaded state
  useEffect(() => {
    const checkLoaded = () => {
      if (window.Hands) {
        setIsModelLoaded(true);
      } else {
        setTimeout(checkLoaded, 100);
      }
    };
    checkLoaded();
  }, []);

  // Step 2: Auto-start camera when model loads
  useEffect(() => {
    if (isModelLoaded) {
      startCamera();
      initMediaPipe();
    }
    return () => {
      stopCamera();
      loopActiveRef.current = false;
    };
  }, [isModelLoaded]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setIsCameraActive(true);
            }).catch(e => console.error(e));
          }
        };
      }
    } catch (err) {
      console.error('Camera stream access failed:', err);
      setErrorMessage('Không thể mở Camera. Vui lòng cấp quyền truy cập camera trong cài đặt.');
    }
  };

  // Initialize MediaPipe Hands model
  const initMediaPipe = () => {
    if (handsRef.current) {
      loopActiveRef.current = true;
      startPredictionLoop();
      return;
    }

    if (!window.Hands) return;

    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    hands.onResults(handleHandsResults);
    handsRef.current = hands;
    
    loopActiveRef.current = true;
    startPredictionLoop();
  };

  // Run frames feed requestAnimationFrame loop
  const startPredictionLoop = () => {
    let isProcessing = false;

    const runFrame = async () => {
      if (!loopActiveRef.current) return;
      const video = videoRef.current;
      const hands = handsRef.current;

      if (video && video.readyState >= 2 && hands && !isProcessing) {
        isProcessing = true;
        try {
          await hands.send({ image: video });
        } catch (e) {
          console.error(e);
        }
        isProcessing = false;
      }
      requestAnimationFrame(runFrame);
    };

    requestAnimationFrame(runFrame);
  };

  // MediaPipe callback - handles gestures, stability calculations, and canvas drawing
  const handleHandsResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fix Canvas DPI to display layout sizing
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const width = canvas.width;
    const height = canvas.height;

    // --- PHASE 1: LOGIC & STATE CALCULATION ---
    let hasTwoHands = false;
    let hand1: any = null;
    let hand2: any = null;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length >= 2) {
      hasTwoHands = true;
      hand1 = results.multiHandLandmarks[0];
      hand2 = results.multiHandLandmarks[1];
      lastHandsRef.current = { hand1, hand2 };

      const thumb1 = hand1[4];
      const index1 = hand1[8];
      const thumb2 = hand2[4];
      const index2 = hand2[8];

      // Calculate hand centers
      const h1x = (thumb1.x + index1.x) / 2;
      const h1y = (thumb1.y + index1.y) / 2;
      const h2x = (thumb2.x + index2.x) / 2;
      const h2y = (thumb2.y + index2.y) / 2;

      // Centroid of the crop box
      const cx = (thumb1.x + index1.x + thumb2.x + index2.x) / 4;
      const cy = (thumb1.y + index1.y + thumb2.y + index2.y) / 4;

      // Angle of the frame orientation based on the line between hand centers
      const theta = Math.atan2(h2y - h1y, h2x - h1x);

      // Rotate the 4 points by -theta around centroid to make them axis-aligned
      const rotPoints = [
        rotatePoint(thumb1.x, thumb1.y, cx, cy, -theta),
        rotatePoint(index1.x, index1.y, cx, cy, -theta),
        rotatePoint(thumb2.x, thumb2.y, cx, cy, -theta),
        rotatePoint(index2.x, index2.y, cx, cy, -theta)
      ];

      const rxMin = Math.min(...rotPoints.map(p => p.x));
      const rxMax = Math.max(...rotPoints.map(p => p.x));
      const ryMin = Math.min(...rotPoints.map(p => p.y));
      const ryMax = Math.max(...rotPoints.map(p => p.y));

      const bw = rxMax - rxMin;
      const bh = ryMax - ryMin;

      // Enforce a minimum bounding box size to activate stable checks
      if (bw > 0.05 && bh > 0.05) {
        boxRef.current = { cx, cy, theta, bw, bh };
        pinchPointsRef.current = [thumb1, index1, thumb2, index2];

        // Stability calculation (sliding history of 12 frames)
        const history = stabilityHistoryRef.current;
        history.push({ cx, cy, theta, bw, bh });
        if (history.length > 12) history.shift();

        const avgCx = history.reduce((acc, b) => acc + b.cx, 0) / history.length;
        const avgCy = history.reduce((acc, b) => acc + b.cy, 0) / history.length;
        const avgTheta = history.reduce((acc, b) => acc + b.theta, 0) / history.length;
        const avgBw = history.reduce((acc, b) => acc + b.bw, 0) / history.length;
        const avgBh = history.reduce((acc, b) => acc + b.bh, 0) / history.length;

        // Compute max deviation including rotational stability
        const maxDev = Math.max(
          Math.abs(cx - avgCx),
          Math.abs(cy - avgCy),
          Math.abs(bw - avgBw),
          Math.abs(bh - avgBh),
          Math.abs(theta - avgTheta) * 0.15
        );

        const isStable = history.length >= 10 && maxDev < 0.025;
        isStableRef.current = isStable;

        if (isStable) {
          if (countdownStartRef.current === null) {
            countdownStartRef.current = Date.now();
          } else {
            const elapsed = Date.now() - countdownStartRef.current;
            const progress = Math.min(100, (elapsed / 2000) * 100);
            countdownProgressRef.current = progress;

            if (progress >= 100) {
              capturePhoto();
              // Reset states
              countdownStartRef.current = null;
              countdownProgressRef.current = 0;
              isStableRef.current = false;
              stabilityHistoryRef.current = [];
              boxRef.current = null;
            }
          }
        } else {
          countdownStartRef.current = null;
          countdownProgressRef.current = 0;
        }
      }
    } else {
      resetTrackingRefs();
      lastHandsRef.current = null;
    }

    // --- PHASE 2: DRAWING DELEGATED TO MODULE ---
    const vWidth = videoRef.current?.videoWidth || 640;
    const vHeight = videoRef.current?.videoHeight || 480;

    drawOverlay(
      ctx,
      width,
      height,
      vWidth,
      vHeight,
      boxRef.current,
      hasTwoHands,
      hand1,
      hand2,
      countdownProgressRef.current,
      countdownStartRef.current,
      isStableRef.current
    );
  };

  const resetTrackingRefs = () => {
    boxRef.current = null;
    pinchPointsRef.current = [];
    countdownStartRef.current = null;
    countdownProgressRef.current = 0;
    isStableRef.current = false;
    stabilityHistoryRef.current = [];
    lastHandsRef.current = null;
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    // Flash animation
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 400);

    // Audio click synth sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn(e);
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    if (vw <= 0 || vh <= 0) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = vw;
    tempCanvas.height = vh;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // 1. Draw mirrored full-screen video frame
    tempCtx.translate(vw, 0);
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(video, 0, 0, vw, vh);
    tempCtx.setTransform(1, 0, 0, 1, 0, 0); // reset transform

    // 2. Draw overlay mask on top if box is active
    const box = boxRef.current;
    const lastHands = lastHandsRef.current;
    if (box && lastHands) {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = vw;
      maskCanvas.height = vh;
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        drawOverlay(
          maskCtx,
          vw, vh,
          vw, vh,
          box,
          true,
          lastHands.hand1,
          lastHands.hand2,
          0, // 0 progress so countdown text/circle is not printed on final image
          null,
          false
        );
        tempCtx.drawImage(maskCanvas, 0, 0);
      }
    }

    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    setIsModalOpen(true);
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `magic-crop-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show fullscreen spinner during model loading or camera permissions
  const showLoading = !isModelLoaded || (!isCameraActive && !errorMessage);

  return (
    <div className="app-container">
      {/* Visual Camera Flash Overlay */}
      <div className={`flash-effect ${flashActive ? 'flash-active' : ''}`} />

      {showLoading && (
        <div className="loading-screen">
          <div className="spinner" />
          <p>{!isModelLoaded ? 'ĐANG TẢI MÔ HÌNH AI...' : 'ĐANG MỞ CAMERA...'}</p>
        </div>
      )}

      {errorMessage && (
        <div className="loading-screen" style={{ color: '#ff4a4a', padding: '2rem', textAlign: 'center' }}>
          <AlertTriangle size={36} style={{ marginBottom: '1rem' }} />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Screen Guide Overlay */}
      {isCameraActive && (
        <div className="guide-banner">
          <div className="pulse-dot" />
          <span>Đưa 2 tay lên để tạo khung ảnh tự động</span>
        </div>
      )}

      {/* Fullscreen Video Stream */}
      <video
        ref={videoRef}
        className="webcam-video"
        playsInline
        muted
        autoPlay
      />

      {/* Overlay drawing canvas */}
      <canvas ref={canvasRef} className="overlay-canvas" />

      {/* Simple Image Download Modal */}
      <PreviewModal
        isOpen={isModalOpen}
        imageSrc={capturedImage}
        onClose={() => setIsModalOpen(false)}
        onDownload={handleDownload}
      />
    </div>
  );
}
