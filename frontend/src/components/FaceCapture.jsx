import React, { useEffect, useRef, useState } from 'react';
import { loadFaceModels, getFaceEmbedding } from '../utils/face.js';

export default function FaceCapture({ onEmbedding, buttonText = 'Capture Face' }) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to start camera safely
  const startCamera = async () => {
    setError('');
    setLoading(true);
    setReady(false);

    try {
      // Load face-api models
      await loadFaceModels();

      // Get video stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Ensure play() is called after srcObject is set
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Video play interrupted:', err);
            setError('Video could not start. Please click Retry.');
          });
        }

        setReady(true);
      }
    } catch (e) {
      console.error(e);
      setError('Camera or model load failed. Make sure camera permissions are allowed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      const v = videoRef.current;
      if (v?.srcObject) {
        v.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current) return;

    try {
      const emb = await getFaceEmbedding(videoRef.current);
      if (!emb) {
        setError('No face detected. Try better lighting / get closer.');
        return;
      }
      onEmbedding(emb);
      setError('');
    } catch (e) {
      console.error(e);
      setError('Error capturing face. Try again.');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12, alignItems: 'center' }}>
      <video
        ref={videoRef}
        width="360"
        height="270"
        style={{ borderRadius: 12, backgroundColor: '#000' }}
        autoPlay
        muted
      />
      {loading && <small>Loading camera and models...</small>}

      {!loading && error && (
        <div>
          <small style={{ color: 'crimson' }}>{error}</small>
          <br />
          <button onClick={startCamera}>Retry</button>
        </div>
      )}

      <button disabled={!ready} onClick={handleCapture}>{buttonText}</button>
    </div>
  );
}
