/*
  app.js - Core client logic for Road Condition Detector
  - Stores configuration for Roboflow (optional)
  - Exposes functions used by pages: detectFile, detectImageElement, saveDetection, readDetections
  - Provides a demo detection mode when no model is configured
*/

// ---------- CONFIGURATION ----------
// If you have a Roboflow model and API key, set them here to enable real detections.
// Example: ROBOFLOW_MODEL = "my-model" and ROBOFLOW_API_KEY = "abcd1234"
const ROBOFLOW_API_KEY = ""; // <-- paste your Roboflow key here (optional)
const ROBOFLOW_MODEL = ""; // <-- paste your Roboflow detect model name here (optional)

// If both above are set, the app will call Roboflow's hosted inference endpoint.
const USE_ROBOFLOW = ROBOFLOW_API_KEY && ROBOFLOW_MODEL;

// LocalStorage key for storing detections for the map page
const STORAGE_KEY = "rcd_detections_v1";

// ---------- Helpers ----------
function nowISO(){ return new Date().toISOString(); }

async function blobFromCanvas(canvas){
  return new Promise((res)=> canvas.toBlob((b)=>res(b),'image/jpeg',0.8));
}

// Save detection object to localStorage
function saveDetection(d){
  const arr = JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
  arr.push(d);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function readDetections(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
}

// Clear detections (for debugging)
function clearDetections(){ localStorage.removeItem(STORAGE_KEY); }

// ---------- Demo detection (random) ----------
// Produces one or more fake predictions when Roboflow isn't configured.
function demoDetect(imageWidth,imageHeight){
  // random single label for simplicity
  const labels = ["pothole","crack","waterlogging"];
  const label = labels[Math.floor(Math.random()*labels.length)];
  const confidence = (0.5 + Math.random()*0.5).toFixed(2);
  // center bbox
  const w = imageWidth*0.3; const h = imageHeight*0.2;
  const x = (imageWidth-w)/2; const y = (imageHeight-h)/2;
  return [{label,confidence:parseFloat(confidence),x,y,w,h}];
}

// ---------- Roboflow detection ----------
// Sends an image blob to Roboflow hosted detect endpoint and parses predictions.
async function roboflowDetectBlob(blob){
  // Roboflow detect endpoint: https://detect.roboflow.com/{MODEL}
  const url = `https://detect.roboflow.com/${ROBOFLOW_MODEL}` + `?api_key=${ROBOFLOW_API_KEY}`;
  const form = new FormData();
  form.append('file', blob, 'frame.jpg');

  const res = await fetch(url, { method: 'POST', body: form });
  if(!res.ok) throw new Error('Roboflow request failed: '+res.status);
  const data = await res.json();
  // Roboflow returns predictions with x, y, width, height (center-based) and confidence
  // Convert to consistent format: {label, confidence, x, y, w, h} where x,y are top-left
  const detected = (data.predictions||[]).map(p=>{
    const w = p.width * p.image_width;
    const h = p.height * p.image_height;
    const x = p.x * p.image_width - w/2;
    const y = p.y * p.image_height - h/2;
    return { label: p.class, confidence: p.confidence, x,y,w,h };
  });
  return detected;
}

// ---------- Public detection helpers used by pages ----------
// Accepts a File object (from input) and returns predictions + image dimensions
async function detectFile(file){
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise((res,rej)=>{ img.onload = res; img.onerror = rej; img.src = url; });
  const w = img.naturalWidth, h = img.naturalHeight;

  if(USE_ROBOFLOW){
    // send file blob directly
    const preds = await roboflowDetectBlob(file);
    URL.revokeObjectURL(url);
    return { predictions: preds, width: w, height: h };
  } else {
    URL.revokeObjectURL(url);
    return { predictions: demoDetect(w,h), width: w, height: h };
  }
}

// Detect from an HTMLImageElement (already loaded). Returns predictions relative to its displayed size.
async function detectImageElement(imgEl){
  const w = imgEl.naturalWidth || imgEl.width;
  const h = imgEl.naturalHeight || imgEl.height;
  if(USE_ROBOFLOW){
    // draw to canvas and send blob
    const canvas = document.createElement('canvas'); canvas.width = imgEl.width; canvas.height = imgEl.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(imgEl,0,0,canvas.width,canvas.height);
    const blob = await blobFromCanvas(canvas);
    const preds = await roboflowDetectBlob(blob);
    return { predictions: preds, width: canvas.width, height: canvas.height };
  } else {
    return { predictions: demoDetect(imgEl.width,imgEl.height), width: imgEl.width, height: imgEl.height };
  }
}

// Capture a video frame to blob and detect (used by webcam page)
async function detectVideoFrame(videoEl){
  const canvas = document.createElement('canvas'); canvas.width = videoEl.videoWidth; canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext('2d'); ctx.drawImage(videoEl,0,0,canvas.width,canvas.height);
  if(USE_ROBOFLOW){
    const blob = await blobFromCanvas(canvas);
    const preds = await roboflowDetectBlob(blob);
    return { predictions: preds, width: canvas.width, height: canvas.height };
  } else {
    return { predictions: demoDetect(canvas.width,canvas.height), width: canvas.width, height: canvas.height };
  }
}

// Expose helpers to global for pages to call
window.RCD = {
  detectFile, detectImageElement, detectVideoFrame,
  saveDetection, readDetections, clearDetections, nowISO
};

// Automatically populate dashboard stats on load if elements are present
document.addEventListener("DOMContentLoaded", () => {
  const totalEl = document.getElementById('totalDetections');
  const potholesEl = document.getElementById('potholesCount');
  const cracksEl = document.getElementById('cracksCount');
  const waterEl = document.getElementById('waterCount');

  if (totalEl || potholesEl || cracksEl || waterEl) {
    const arr = window.RCD.readDetections();
    let potholes = 0, cracks = 0, water = 0;
    arr.forEach(d => {
      if (d.label === 'pothole') potholes++;
      else if (d.label === 'crack') cracks++;
      else if (d.label === 'waterlogging') water++;
    });
    if (totalEl) totalEl.textContent = arr.length;
    if (potholesEl) potholesEl.textContent = potholes;
    if (cracksEl) cracksEl.textContent = cracks;
    if (waterEl) waterEl.textContent = water;
  }
});
