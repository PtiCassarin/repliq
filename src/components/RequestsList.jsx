import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function RequestsList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // À remplacer par l'ID de l'utilisateur connecté
        const userId = 'USER_ID';
        const q = query(
          collection(db, 'requests'),
          where('userId', '==', userId)
        );
        
        const querySnapshot = await getDocs(q);
        const requestsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRequests(requestsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Acceptée';
      case 'rejected':
        return 'Refusée';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Demandes en cours</h2>
      {requests.length === 0 ? (
        <p className="text-gray-500">Aucune demande en cours</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white shadow rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Ticket de caisse</p>
                  <p className="text-sm text-gray-500">
                    {new Date(request.createdAt?.toDate()).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    request.status
                  )}`}
                >
                  {getStatusText(request.status)}
                </span>
              </div>
              {request.extractedText && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Texte extrait : {request.extractedText}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 