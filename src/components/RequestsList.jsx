import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, where, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const RequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookSelector, setShowBookSelector] = useState(null);
  const [showPreview, setShowPreview] = useState(null);
  const [showExtractedText, setShowExtractedText] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('État de l\'utilisateur dans RequestsList:', user);
      console.log('Rôle de l\'utilisateur:', user.role);
      fetchRequests();
      fetchBooks();
    }
  }, [user]);

  useEffect(() => {
    // Recherche automatique des livres correspondants pour les demandes avec titre détecté
    const findMatchingBooks = async () => {
      const requestsWithTitle = requests.filter(req => req.detectedTitle && !req.matchedBook);
      
      for (const request of requestsWithTitle) {
        const q = query(
          collection(db, 'books'),
          where('title', '>=', request.detectedTitle.toUpperCase()),
          where('title', '<=', request.detectedTitle.toUpperCase() + '\uf8ff')
        );
        
        try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const matchedBook = querySnapshot.docs[0].data();
            await updateDoc(doc(db, 'requests', request.id), {
              matchedBook: {
                id: querySnapshot.docs[0].id,
                title: matchedBook.title,
                author: matchedBook.author,
                year: matchedBook.year
              }
            });
          }
        } catch (error) {
          console.error('Erreur lors de la recherche automatique:', error);
        }
      }
      
      if (requestsWithTitle.length > 0) {
        fetchRequests(); // Rafraîchir les demandes si des correspondances ont été trouvées
      }
    };

    findMatchingBooks();
  }, [requests]);

  const fetchBooks = async () => {
    try {
      const booksRef = collection(db, 'books');
      const querySnapshot = await getDocs(booksRef);
      const booksList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBooks(booksList);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const requestsRef = collection(db, 'requests');
      const q = query(requestsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const requestsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes:', error);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    if (!user || user.role !== 'admin') {
      console.error('Accès non autorisé');
      console.error('État de l\'utilisateur:', user);
      console.error('Rôle de l\'utilisateur:', user?.role);
      return;
    }

    try {
      console.log('Tentative de mise à jour du statut pour la demande:', requestId);
      console.log('Utilisateur actuel:', user);
      console.log('Est administrateur:', user.role === 'admin');
      
      // Vérifier si l'utilisateur est dans la liste des administrateurs
      const configRef = doc(db, 'config', 'admin_emails');
      const configDoc = await getDoc(configRef);
      console.log('Document admin_emails:', configDoc.data());
      
      const requestRef = doc(db, 'requests', requestId);
      const request = requests.find(r => r.id === requestId);
      
      console.log('Demande trouvée:', request);
      
      if (newStatus === 'approved' && request.matchedBook) {
        // Récupérer toutes les informations du livre depuis la collection books
        const bookRef = doc(db, 'books', request.matchedBook.id);
        const bookDoc = await getDoc(bookRef);
        const bookData = bookDoc.data();
        
        console.log('Données du livre à ajouter:', bookData);

        // Préparer les données du livre en s'assurant qu'il n'y a pas de valeurs undefined
        const libraryBookData = {
          bookId: request.matchedBook.id,
          title: bookData.title || '',
          author: bookData.author || '',
          year: bookData.year || '',
          coverImage: bookData.coverImage || 'https://via.placeholder.com/200x300?text=Livre',
          ebookUrl: bookData.ebookUrl || '',
          addedAt: new Date(),
          requestId: requestId
        };

        // Ajouter le résumé seulement s'il existe
        if (bookData.summary) {
          libraryBookData.summary = bookData.summary;
        }

        console.log('Tentative d\'ajout du livre à la bibliothèque de l\'utilisateur:', request.userId);
        
        // Ajouter le livre à la bibliothèque de l'utilisateur
        const userLibraryRef = collection(db, 'users', request.userId, 'library');
        const docRef = await addDoc(userLibraryRef, libraryBookData);
        
        console.log('Livre ajouté à la bibliothèque avec ID:', docRef.id);
      }

      console.log('Tentative de mise à jour du statut de la demande');
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: new Date(),
        adminEmail: user.email
      });
      
      console.log('Statut de la demande mis à jour avec succès');
      fetchRequests();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      console.error('Détails de l\'erreur:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
    }
  };

  const handleBookSelection = async (requestId, selectedBookId) => {
    try {
      const selectedBook = books.find(book => book.id === selectedBookId);
      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, {
        matchedBook: {
          id: selectedBook.id,
          title: selectedBook.title,
          author: selectedBook.author,
          year: selectedBook.year
        }
      });
      setShowBookSelector(null);
      fetchRequests();
    } catch (error) {
      console.error('Erreur lors de la sélection du livre:', error);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const BookSelector = ({ requestId }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium mb-4">Sélectionner un livre</h3>
          <input
            type="text"
            placeholder="Rechercher un livre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <div className="max-h-96 overflow-y-auto">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => handleBookSelection(requestId, book.id)}
                className="p-2 hover:bg-gray-100 cursor-pointer border-b"
              >
                <h4 className="font-medium">{book.title}</h4>
                <p className="text-sm text-gray-600">{book.author}</p>
                <p className="text-xs text-gray-500">Année: {book.year}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button
              onClick={() => setShowBookSelector(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const pendingRequests = requests.filter(request => request.status === 'pending');
  const historyRequests = requests.filter(request => request.status !== 'pending');

  const ImagePreview = ({ imageUrl, onClose }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white p-4 rounded-lg max-w-4xl mx-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          src={imageUrl}
          alt="Ticket de caisse"
          className="max-h-[80vh] w-auto"
        />
      </div>
    </div>
  );

  const renderRequest = (request, showActions = true) => (
    <div key={request.id} className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Demande de {request.userEmail}
          </h2>
          <p className="text-gray-600">
            Date: {request.createdAt?.toDate().toLocaleString()}
          </p>
          {!showActions && (
            <p className={`font-semibold ${
              request.status === 'approved' ? 'text-green-600' : 'text-red-600'
            }`}>
              Statut: {request.status === 'approved' ? 'Approuvé' : 'Refusé'}
            </p>
          )}
          {request.adminEmail && (
            <p className="text-gray-600 text-sm mt-1">
              Traité par: {request.adminEmail}
            </p>
          )}
        </div>
        {showActions && (
          <div className="flex space-x-2">
            {!request.matchedBook ? (
              <button
                onClick={() => setShowBookSelector(request.id)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Sélectionner un livre
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowBookSelector(request.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Changer le livre
                </button>
                <button
                  onClick={() => handleStatusUpdate(request.id, 'approved')}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Approuver
                </button>
                <button
                  onClick={() => handleStatusUpdate(request.id, 'rejected')}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Refuser
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-start space-x-4 mb-4">
        <div 
          className="cursor-pointer relative group"
          onClick={() => setShowPreview(request.ticketImageBase64)}
        >
          <img
            src={request.ticketImageBase64}
            alt="Ticket de caisse"
            className="w-32 h-32 object-cover rounded"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100">
              Agrandir
            </span>
          </div>
        </div>

        <div className="flex-1">
          {request.detectedTitle && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Titre du livre détecté :</h3>
              <p className="text-gray-700">{request.detectedTitle}</p>
            </div>
          )}

          <button
            onClick={() => setShowExtractedText(prev => ({
              ...prev,
              [request.id]: !prev[request.id]
            }))}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showExtractedText[request.id] ? 'Masquer le texte extrait' : 'Voir le texte extrait'}
          </button>

          {showExtractedText[request.id] && (
            <div className="mt-2">
              <p className="text-gray-700 whitespace-pre-wrap text-sm">
                {request.extractedText}
              </p>
            </div>
          )}
        </div>
      </div>

      {request.matchedBook && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Livre correspondant :</h3>
          <p className="text-gray-700 font-medium">{request.matchedBook.title}</p>
          <p className="text-gray-600">par {request.matchedBook.author}</p>
          <p className="text-gray-500 text-sm">Année de publication : {request.matchedBook.year}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Gestion des demandes</h1>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Demandes en attente ({pendingRequests.length})
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('history')}
            >
              Historique ({historyRequests.length})
            </button>
          </nav>
        </div>
      </div>

      {showBookSelector && <BookSelector requestId={showBookSelector} />}
      {showPreview && (
        <ImagePreview
          imageUrl={showPreview}
          onClose={() => setShowPreview(null)}
        />
      )}

      <div className="space-y-6">
        {activeTab === 'pending'
          ? pendingRequests.map(request => renderRequest(request, true))
          : historyRequests.map(request => renderRequest(request, false))}
      </div>
    </div>
  );
};

export default RequestsList; 