import { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { createWorker } from 'tesseract.js';
import { useAuth } from '../context/AuthContext';

export default function NewRequest() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const processImage = async (base64Image) => {
    const worker = await createWorker('fra');
    const { data: { text } } = await worker.recognize(base64Image);
    await worker.terminate();
    return text;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Convertir l'image en base64
      const base64Image = await convertToBase64(file);

      // OCR sur l'image
      const extractedText = await processImage(base64Image);

      // Création de la demande dans Firestore
      await addDoc(collection(db, 'requests'), {
        userId: user.uid,
        ticketImageBase64: base64Image,
        extractedText,
        status: 'pending',
        createdAt: new Date(),
      });

      setFile(null);
      alert('Demande envoyée avec succès !');
    } catch (err) {
      setError('Une erreur est survenue lors du traitement de votre demande.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
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
  );
} 