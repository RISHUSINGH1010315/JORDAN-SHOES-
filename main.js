// Jordan 1 Scroll Animation Engine
import './cart.js';

// Configuration
const TOTAL_FRAMES = 240;
const frameImages = [];
let loadedCount = 0;
let isLoaded = false;
let framesPathPrefix = 'frames/'; // Dynamic base path detected at runtime

// DOM Elements
const loader = document.getElementById('loader');
const progressCircle = document.getElementById('progress-circle');
const progressPercent = document.getElementById('progress-percent');
const loaderStatus = document.getElementById('loader-status');
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const scrollWrapper = document.getElementById('scroll-wrapper');
const scrollSections = document.querySelectorAll('.scroll-section');
const detailsCanvas = document.getElementById('details-canvas');
const detailsCtx = detailsCanvas.getContext('2d');

// Animation State
let currentFrame = 0;
let targetFrame = 0;
let scrollY = 0;

// Set up circular progress dashoffset
const CIRCUMFERENCE = 2 * Math.PI * 50; // r=50
progressCircle.style.strokeDasharray = CIRCUMFERENCE;
progressCircle.style.strokeDashoffset = CIRCUMFERENCE;

// Dynamic frame path detection to support Vercel, localhost, and GitHub Pages (even if deployed incorrectly)
function detectFramesPath() {
  return new Promise((resolve) => {
    // 1. Try to load the first frame using the default 'frames/' path
    const testImg = new Image();
    testImg.src = 'frames/ezgif-frame-001.jpg';
    
    testImg.onload = () => {
      console.log("Frames detected at 'frames/'");
      resolve('frames/');
    };
    
    testImg.onerror = () => {
      // 2. If it fails, try the fallback 'public/frames/' path (raw source server)
      console.warn("Failed to load frame from 'frames/'. Trying 'public/frames/'...");
      const fallbackImg = new Image();
      fallbackImg.src = 'public/frames/ezgif-frame-001.jpg';
      
      fallbackImg.onload = () => {
        console.log("Frames detected at 'public/frames/'");
        resolve('public/frames/');
      };
      
      fallbackImg.onerror = () => {
        // 3. Try GitHub Pages specific fallback with repo name
        console.warn("Failed to load frame from 'public/frames/'. Checking URL structure...");
        const path = window.location.pathname;
        if (path.includes('/JORDAN-SHOES-')) {
          console.log("GitHub Pages repo detected. Resolving via '/JORDAN-SHOES-/frames/'");
          resolve('/JORDAN-SHOES-/frames/');
        } else {
          // Fall back to default
          resolve('frames/');
        }
      };
    };
  });
}

// 1. Image Preloader
function preloadImages() {
  loaderStatus.textContent = "LOADING FRAME SEQUENCE...";
  
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    // Padding numbers to 3 digits (e.g. 001, 042, 240)
    const paddedIndex = String(i).padStart(3, '0');
    img.src = `${framesPathPrefix}ezgif-frame-${paddedIndex}.jpg`;
    
    img.onload = () => {
      loadedCount++;
      updateLoaderProgress();
    };
    
    img.onerror = () => {
      console.warn(`Failed to load frame ${paddedIndex} at ${img.src}`);
      loadedCount++; // Increment anyway to prevent blockages
      updateLoaderProgress();
    };
    
    frameImages.push(img);
  }
}

function updateLoaderProgress() {
  const percent = (loadedCount / TOTAL_FRAMES) * 100;
  
  // Update dashoffset
  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * percent) / 100;
  progressCircle.style.strokeDashoffset = offset;
  progressPercent.textContent = `${Math.round(percent)}%`;
  
  if (loadedCount >= TOTAL_FRAMES) {
    completePreloading();
  }
}

function completePreloading() {
  isLoaded = true;
  loaderStatus.textContent = "ASSETS LOADED";
  
  // Smoothly fade out loader
  setTimeout(() => {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.remove();
    }, 800);
  }, 300);
  
  // Initialize canvas drawings and start main render loop
  initCanvasSize();
  renderDetailsCanvas();
  requestAnimationFrame(updateLoop);
}

// 2. High-Performance Canvas Cover Drawing Helper
function drawImageCover(context, img) {
  const canvasW = context.canvas.width;
  const canvasH = context.canvas.height;
  
  const imgW = img.naturalWidth || img.width || 1920;
  const imgH = img.naturalHeight || img.height || 1080;
  
  const canvasRatio = canvasW / canvasH;
  const imgRatio = imgW / imgH;
  
  let sourceX = 0;
  let sourceY = 0;
  let sourceW = imgW;
  let sourceH = imgH;
  
  if (canvasRatio > imgRatio) {
    // Canvas is wider than image (relatively)
    sourceH = imgW / canvasRatio;
    sourceY = (imgH - sourceH) / 2;
  } else {
    // Canvas is taller than image (relatively)
    sourceW = imgH * canvasRatio;
    sourceX = (imgW - sourceW) / 2;
  }
  
  context.clearRect(0, 0, canvasW, canvasH);
  context.drawImage(
    img,
    sourceX, sourceY, sourceW, sourceH,
    0, 0, canvasW, canvasH
  );
}

// 3. Canvas Resizing (Handles High-DPI Screens)
function initCanvasSize() {
  const dpr = window.devicePixelRatio || 1;
  
  // Resizing Main Scroll Canvas
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  
  // Resizing Interactive details Canvas
  const rect = detailsCanvas.parentElement.getBoundingClientRect();
  detailsCanvas.width = rect.width * dpr;
  detailsCanvas.height = rect.height * dpr;
  
  // Immediate redraws
  if (isLoaded) {
    const currentRoundedFrame = Math.round(currentFrame);
    if (frameImages[currentRoundedFrame]) {
      drawImageCover(ctx, frameImages[currentRoundedFrame]);
    }
    renderDetailsCanvas();
  }
}

// Draw the last frame (frame 239) on the interactive showcase canvas
function renderDetailsCanvas() {
  const finalFrame = frameImages[TOTAL_FRAMES - 1];
  if (finalFrame) {
    drawImageCover(detailsCtx, finalFrame);
  }
}

// 4. Update Scroll Progress and Targets
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
  
  // Calculate how much we can scroll inside the wrapper
  const maxScroll = scrollWrapper.offsetHeight - window.innerHeight;
  if (maxScroll <= 0) return;
  
  // We cap the scroll percentage at 1.0 (some browsers allow overscrolling)
  const scrollFraction = Math.min(1, Math.max(0, scrollY / maxScroll));
  
  // Calculate target frame
  targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
});

// 5. requestAnimationFrame Interpolation (Easing) Loop
function updateLoop() {
  if (!isLoaded) return;
  
  // Linear Interpolation: currentFrame eased towards targetFrame
  // 0.08 offers a silky smooth deceleration
  const diff = targetFrame - currentFrame;
  currentFrame += diff * 0.08;
  
  // Snap when extremely close
  if (Math.abs(diff) < 0.005) {
    currentFrame = targetFrame;
  }
  
  // Render frame
  const frameToRender = Math.min(
    TOTAL_FRAMES - 1,
    Math.max(0, Math.round(currentFrame))
  );
  
  const img = frameImages[frameToRender];
  if (img && img.complete) {
    drawImageCover(ctx, img);
  }
  
  // Handle text overlays entry and exit states
  updateTextOverlays();
  
  requestAnimationFrame(updateLoop);
}

// 6. Sync Text Overlays with Scroll Viewport Positions
function updateTextOverlays() {
  scrollSections.forEach((section) => {
    const content = section.querySelector('.section-content');
    const rect = section.getBoundingClientRect();
    
    // Check if section is centered in the viewport
    const viewportHeight = window.innerHeight;
    const triggerTop = viewportHeight * 0.3;
    const triggerBottom = viewportHeight * 0.7;
    
    // Section center point relative to viewport
    const sectionCenter = rect.top + rect.height / 2;
    
    if (sectionCenter > triggerTop && sectionCenter < triggerBottom) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

// 7. Interactive Hotspot Triggers
const hotspots = document.querySelectorAll('.hotspot');
const infoCards = document.querySelectorAll('.info-card');
const defaultMessage = document.getElementById('details-default-message');

hotspots.forEach((hotspot) => {
  hotspot.addEventListener('click', (e) => {
    e.stopPropagation();
    
    const targetId = hotspot.id.replace('hotspot-', 'details-');
    const targetCard = document.getElementById(targetId);
    
    // Toggle active state
    if (hotspot.classList.contains('active')) {
      // Deactivate
      hotspot.classList.remove('active');
      targetCard.classList.remove('active');
      defaultMessage.classList.add('active');
    } else {
      // Reset others
      hotspots.forEach(h => h.classList.remove('active'));
      infoCards.forEach(c => c.classList.remove('active'));
      defaultMessage.classList.remove('active');
      
      // Activate selected
      hotspot.classList.add('active');
      if (targetCard) {
        targetCard.classList.add('active');
      }
    }
  });
});

// Click outside details wrapper to reset to default helper message
document.addEventListener('click', (e) => {
  if (!e.target.closest('.interactive-interactive-wrapper')) {
    hotspots.forEach(h => h.classList.remove('active'));
    infoCards.forEach(c => c.classList.remove('active'));
    defaultMessage.classList.add('active');
  }
});

// 8. Event Listeners
window.addEventListener('resize', initCanvasSize);
window.addEventListener('orientationchange', () => {
  setTimeout(initCanvasSize, 200);
});

// Run Preloading after detecting path
detectFramesPath().then((detectedPath) => {
  framesPathPrefix = detectedPath;
  preloadImages();
});

// 9. WebGL Vignette Shader Background Animation (from code.html)
function initShaderCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  function syncSize() {
    const w = canvas.clientWidth  || 1280;
    const h = canvas.clientHeight || 720;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }
  }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncSize).observe(canvas);
  }
  syncSize();

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;
  const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
  const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = v_texCoord;
    
    // Create a deep red radial gradient vignette
    float dist = distance(uv, vec2(0.5, 0.5));
    vec3 innerColor = vec3(0.5, 0.0, 0.0); // Deep Red
    vec3 outerColor = vec3(0.05, 0.0, 0.0); // Near Black
    
    vec3 color = mix(innerColor, outerColor, smoothstep(0.2, 0.8, dist));
    
    // Add a subtle pulsing spotlight glow
    float pulse = 0.5 + 0.5 * sin(u_time * 0.5);
    float glow = smoothstep(0.4, 0.0, dist) * 0.1 * pulse;
    color += vec3(1.0, 0.2, 0.2) * glow;
    
    // Subtle ambient noise/particles
    float noise = fract(sin(dot(uv * u_time, vec2(12.9898, 78.233))) * 43758.5453);
    color += noise * 0.01;

    gl_FragColor = vec4(color, 1.0);
}`;

  function cs(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes = gl.getUniformLocation(prog, 'u_resolution');

  function render(t) {
    if (typeof ResizeObserver === 'undefined') syncSize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (uTime) gl.uniform1f(uTime, t * 0.001);
    if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  render(0);
}

// Initialize WebGL background shader above the footer
initShaderCanvas('shader-canvas-above-footer');
