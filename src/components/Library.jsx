import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Library() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        // À remplacer par l'ID de l'utilisateur connecté
        const userId = 'USER_ID';
        const q = query(
          collection(db, 'userBooks'),
          where('userId', '==', userId)
        );
        
        const querySnapshot = await getDocs(q);
        const booksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setBooks(booksData);
      } catch (error) {
        console.error('Erreur lors de la récupération des livres:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Ma bibliothèque</h2>
      {books.length === 0 ? (
        <p className="text-gray-500">Aucun livre dans votre bibliothèque</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="p-4">
                <h3 className="font-medium text-lg mb-2">{book.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {book.summary}
                </p>
                <div className="flex justify-between items-center">
                  <a
                    href={book.ebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Télécharger
                  </a>
                  <span className="text-xs text-gray-500">
                    Ajouté le {new Date(book.addedAt?.toDate()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 