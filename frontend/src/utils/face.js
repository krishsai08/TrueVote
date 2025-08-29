import * as faceapi from 'face-api.js';
export async function loadFaceModels() {
  const MODEL_URL = '/models';
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
}
export async function getFaceEmbedding(inputEl) {
  const det = await faceapi
    .detectSingleFace(inputEl, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  if (!det) return null;
  return Array.from(det.descriptor);
}
export function euclideanDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}
export function isMatch(emb1, emb2, threshold = 0.6) {
  return euclideanDistance(emb1, emb2) < threshold;
}
