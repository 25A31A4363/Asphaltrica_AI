# Road Condition Detector (Vanilla Web Dashboard)

This project is a simple, client-side dashboard to detect road conditions (potholes, cracks, waterlogging) from images and live camera using either Roboflow hosted inference or a demo mode (no backend required).

Features
- Upload image detection with bounding boxes and confidence scores
- Live webcam detection (real-time frames)
- Map visualization using Leaflet.js — detections with geolocation are pinned on the map
- Clean responsive dashboard UI with sidebar navigation

Tech Stack
- Vanilla HTML, CSS, JavaScript
- Optional: Roboflow inference API for real detection
- Leaflet.js for map visualization

Project structure
```
road-condition-detector/
├── index.html
├── style.css
├── app.js
├── pages/
│   ├── upload.html
│   ├── webcam.html
│   └── map.html
├── assets/
│   └── sample-images/
└── README.md
```

How to run
1. Open `index.html` in a modern browser (Chrome, Edge, Firefox). No server required for most features.
2. To enable real detection with Roboflow, set `ROBOFLOW_API_KEY` and `ROBOFLOW_MODEL` in `app.js`. Example:

```js
const ROBOFLOW_API_KEY = "abcd1234";
const ROBOFLOW_MODEL = "your-model-name";
```

3. On the Upload page, choose an image and click Detect.
4. On the Webcam page, allow camera access and click Start to run real-time detection.
5. On the Map page, use "Center to My Location" to focus the map and "Reload Detections" to show saved detections. Detections from webcam will include geolocation when allowed.

Notes & Limitations
- The demo mode (when Roboflow is not configured) generates synthetic detections for UI demonstration.
- Roboflow's free tier may have rate limits; for frequent real-time webcam inference consider using a local TensorFlow.js model (not included here).
- Browser security: some browsers restrict camera and geolocation access when serving files from the local filesystem. If you encounter limits, run a simple static server, for example:

```bash
# Python 3
python -m http.server 8000

# then open http://localhost:8000/road-condition-detector/
```

Future improvements
- Integrate a client-side TensorFlow.js model for offline webcam detection
- Add better management UI for pinned detections (edit/delete)
- Allow uploading multiple images and batch processing
- Persist images in indexedDB or Cloud storage for sharing

License
This project is provided as-is for learning and prototyping.
