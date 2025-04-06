import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [books, setBooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    year: '',
    summary: '',
    ebookUrl: '',
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'books'));
      const booksList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBooks(booksList);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBook(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Ajouter le livre à Firestore avec une image par défaut
      await addDoc(collection(db, 'books'), {
        ...newBook,
        coverImage: 'https://via.placeholder.com/200x300?text=Livre',
        createdAt: new Date()
      });

      // Réinitialiser le formulaire
      setNewBook({
        title: '',
        author: '',
        year: '',
        summary: '',
        ebookUrl: '',
      });

      setMessage('Livre ajouté avec succès !');
      setShowForm(false);
      fetchBooks(); // Rafraîchir la liste des livres
    } catch (error) {
      setMessage('Erreur lors de l\'ajout du livre : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Administration</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            {showForm ? 'Annuler' : 'Ajouter un livre'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  name="title"
                  value={newBook.title}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auteur
                </label>
                <input
                  type="text"
                  name="author"
                  value={newBook.author}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Année de publication
                </label>
                <input
                  type="number"
                  name="year"
                  value={newBook.year}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lien eBook (EPUB/PDF)
                </label>
                <input
                  type="url"
                  name="ebookUrl"
                  value={newBook.ebookUrl}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Résumé
                </label>
                <textarea
                  name="summary"
                  value={newBook.summary}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? 'Ajout en cours...' : 'Ajouter le livre'}
              </button>
            </div>
          </form>
        )}

        {message && (
          <p className={`mt-2 ${message.includes('Erreur') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Liste des livres dans la base de données :</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {books.map((book) => (
            <div key={book.id} className="border rounded-lg p-4 bg-white shadow">
              <div className="flex">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-24 h-32 object-cover rounded"
                />
                <div className="ml-4">
                  <h4 className="font-semibold">{book.title}</h4>
                  <p className="text-sm text-gray-600">{book.author}</p>
                  <p className="text-xs text-gray-500 mt-1">Année: {book.year}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2 line-clamp-2">{book.summary}</p>
              <a
                href={book.ebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
              >
                Voir l'eBook
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 