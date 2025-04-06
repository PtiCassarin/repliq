import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function Library() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const { user } = useAuth();

  const fetchBooks = async () => {
    if (!user) return;
    
    try {
      const userLibraryRef = collection(db, 'users', user.uid, 'library');
      const querySnapshot = await getDocs(userLibraryRef);
      const booksData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Données du livre:', data);
        return {
          id: doc.id,
          ...data,
          ebookUrl: data.ebookUrl || null
        };
      });
      
      console.log('Liste complète des livres:', booksData);
      setBooks(booksData);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [user]);

  const openPdfReader = (book) => {
    setSelectedBook(book);
    setShowPdfModal(true);
  };

  const closePdfReader = () => {
    setShowPdfModal(false);
    setSelectedBook(null);
  };

  if (loading) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  if (books.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Ma Bibliothèque</h1>
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Votre bibliothèque est vide.</p>
          <p className="text-gray-500 mt-2">Envoyez une demande pour obtenir des livres numériques.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Ma Bibliothèque</h1>
      </div>
      <div className="space-y-4">
        {books.map((book) => {
          console.log('Rendu du livre:', book.title, 'URL:', book.ebookUrl);
          return (
            <div key={book.id} className="bg-white shadow rounded-lg overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-1/4 lg:w-1/5">
                <img
                  src={book.coverImage || 'https://via.placeholder.com/200x300?text=Livre'}
                  alt={book.title}
                  className="w-full h-full object-cover md:h-auto md:min-h-[200px]"
                />
              </div>
              <div className="p-4 md:w-3/4 lg:w-4/5 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{book.title}</h2>
                  <p className="text-gray-600 mb-1">par {book.author}</p>
                  <p className="text-gray-500 text-sm mb-2">Année de publication : {book.year}</p>
                  {book.summary && (
                    <p className="text-gray-700 text-sm mb-2 line-clamp-2">{book.summary}</p>
                  )}
                </div>
                <div className="mt-2">
                  {book.ebookUrl ? (
                    <button
                      onClick={() => openPdfReader(book)}
                      className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Lire le livre
                    </button>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      <p>Le livre numérique n'est pas encore disponible.</p>
                      <p className="mt-1">Il sera ajouté prochainement.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal pour afficher le PDF */}
      {showPdfModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedBook.title}</h2>
              <button 
                onClick={closePdfReader}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
              <iframe
                src={`${selectedBook.ebookUrl}#toolbar=0`}
                className="w-full h-full border-0"
                title={`PDF de ${selectedBook.title}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 