// faceRecognition.js
import * as faceapi from 'face-api.js';

export const loadLabeledImages = async () => {
  const labels = ['Damien'];
  console.log('Chargement des images étiquetées pour les labels:', labels);

  return Promise.all(
    labels.map(async label => {
      const descriptions = [];
      for (let i = 1; i <= 4; i++) { 
        try {
          console.log(`Chargement de l'image: /images/${label}/${i}.jpg`);
          const img = await faceapi.fetchImage(`/images/${label}/${i}.jpg`);
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
          if (detections && detections.descriptor) {
            descriptions.push(detections.descriptor);
            console.log(`Détection réussie pour l'image: /images/${label}/${i}.jpg`);
          } else {
            console.error(`Aucune détection pour l'image: /images/${label}/${i}.jpg`);
          }
        } catch (error) {
          console.error(`Erreur lors du traitement de l'image: /images/${label}/${i}.jpg`, error);
        }
      }
      if (descriptions.length === 0) {
        console.error(`Aucune description trouvée pour le label: ${label}`);
      }
      console.log(`Descriptions pour ${label}:`, descriptions);
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
};