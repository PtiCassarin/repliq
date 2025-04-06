import React, { useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { db } from '../config/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const NewRequest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    
    try {
      const requestsRef = collection(db, 'requests');
      const q = query(
        requestsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const requestsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes:', error);
      setError('Erreur lors de la récupération des demandes');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setMessage('');
    }
  };

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const convertToBase64 = async (file) => {
    const compressedBase64 = await compressImage(file);
    return compressedBase64;
  };

  const processImage = async (base64Image) => {
    if (!user) {
      setError('Vous devez être connecté pour soumettre une demande');
      return;
    }

    try {
      const worker = await createWorker('fra');
      const { data: { text } } = await worker.recognize(base64Image);
      await worker.terminate();

      const lines = text.split('\n');
      let detectedTitle = null;

      for (const line of lines) {
        const match = line.match(/^(?:\d+\s+)?([A-Z][^0-9]+?)\s+\d+[,\.]\d{2}/);
        if (match) {
          const title = match[1].trim();
          if (
            title.length > 3 &&
            !/^(total|prix|montant|tva|remise)/i.test(title) &&
            !/^\d+$/.test(title) &&
            !/^[^a-zA-Z]/.test(title) &&
            title.split(' ').length >= 1
          ) {
            detectedTitle = title;
            break;
          }
        }
      }

      console.log('Texte extrait:', text);
      console.log('Titre détecté:', detectedTitle);

      const requestData = {
        userId: user.uid,
        userEmail: user.email,
        ticketImageBase64: base64Image,
        extractedText: text,
        detectedTitle: detectedTitle || '',
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'requests'), requestData);
      setMessage('Demande envoyée avec succès !');
      await fetchRequests();
      setFile(null);
    } catch (error) {
      console.error('Erreur lors du traitement de l\'image:', error);
      setError('Erreur lors du traitement de l\'image. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez sélectionner une image');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const base64Image = await convertToBase64(file);
      await processImage(base64Image);
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      setError('Une erreur est survenue lors du traitement de l\'image');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Approuvée';
      case 'rejected':
        return 'Refusée';
      default:
        return 'En attente';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Nouvelle demande</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ticket de caisse
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
              className="mt-1 block w-full"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {message && (
            <div className="text-green-500 text-sm">{message}</div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              !file || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Traitement en cours...' : 'Envoyer la demande'}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Mes demandes en cours</h3>
        {requests.length === 0 ? (
          <p className="text-gray-600">Aucune demande en cours</p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white shadow rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {request.createdAt?.toDate().toLocaleString('fr-FR', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                    <p className={`font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </p>
                    {request.detectedTitle && (
                      <p className="font-medium">
                        Titre détecté : {request.detectedTitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <img
                    src={request.ticketImageBase64}
                    alt="Ticket de caisse"
                    className="max-w-full h-32 object-cover rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewRequest; 