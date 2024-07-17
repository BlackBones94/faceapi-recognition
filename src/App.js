import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { loadLabeledImages } from './faceRecognition';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Chargement des modèles...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        setIsModelsLoaded(true);
        console.log('Modèles chargés avec succès.');
      } catch (err) {
        console.error('Erreur lors du chargement des modèles :', err);
      }
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsVideoPlaying(true);
            console.log('Caméra démarrée et vidéo lue');
          };
        })
        .catch(err => {
          console.error('Erreur d\'accès à la caméra :', err);
        });
    };

    loadModels().then(startVideo);
  }, []);

  useEffect(() => {
    if (isModelsLoaded) {
      console.log('Chargement des images étiquetées...');
      loadLabeledImages().then(labeledFaceDescriptors => {
        const matcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6); 
        setFaceMatcher(matcher);
        console.log('Images étiquetées chargées avec succès.');
      }).catch(err => {
        console.error('Erreur lors du chargement des images étiquetées :', err);
      });
    }
  }, [isModelsLoaded]);

  const handleDetectFaces = async () => {
    if (!isModelsLoaded || !faceMatcher) {
      console.log('Modèles ou faceMatcher non chargés');
      return;
    }
    console.log('Début de la détection des visages');

    const detectFaces = async () => {
      if (videoRef.current && faceMatcher) {
        console.log('Détection des visages en cours...');
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
          .withFaceLandmarks()
          .withFaceDescriptors();
        console.log('Détections:', detections);
        if (detections.length === 0) {
          console.log('Aucun visage détecté');
        }

        const resizedDetections = faceapi.resizeResults(detections, {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        });
        console.log('Redimensionnement des détections:', resizedDetections);

        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (resizedDetections.length) {
          const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
          console.log('Résultats des correspondances:', results);

          results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            const color = result.label === 'unknown' ? 'red' : 'green';
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString(), boxColor: color });
            drawBox.draw(canvas);

            console.log(`Face ${i + 1}: ${result.toString()}`);
          });
        }
      }
      requestAnimationFrame(detectFaces);
    };

    detectFaces();
  };

  return (
    <div className="App">
      <h1>Face Recognition App</h1>
      <div style={{ position: 'relative', width: '720px', height: '560px' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />
      </div>
      <button onClick={handleDetectFaces} disabled={!isVideoPlaying || !faceMatcher}>
        Démarrer la détection des visages
      </button>
    </div>
  );
}

export default App;