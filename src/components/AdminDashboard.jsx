import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [books, setBooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    year: '',
    summary: '',
    ebookUrl: '',
    coverImage: '',
  });

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');

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

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const bookData = {
        ...newBook,
        coverImage: coverImagePreview || 'https://via.placeholder.com/200x300?text=Livre',
        createdAt: new Date()
      };

      // Supprimer le résumé s'il est vide
      if (!bookData.summary.trim()) {
        delete bookData.summary;
      }

      await addDoc(collection(db, 'books'), bookData);

      setNewBook({
        title: '',
        author: '',
        year: '',
        summary: '',
        ebookUrl: '',
        coverImage: '',
      });
      setCoverImageFile(null);
      setCoverImagePreview('');

      setMessage('Livre ajouté avec succès !');
      setShowForm(false);
      fetchBooks();
    } catch (error) {
      setMessage('Erreur lors de l\'ajout du livre : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image de couverture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
                {coverImagePreview && (
                  <div className="mt-2">
                    <img
                      src={coverImagePreview}
                      alt="Aperçu de la couverture"
                      className="w-32 h-40 object-cover rounded"
                    />
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Résumé (optionnel)
                </label>
                <textarea
                  name="summary"
                  value={newBook.summary}
                  onChange={handleInputChange}
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
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher un livre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {filteredBooks.map((book) => (
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
              {book.summary && (
                <p className="text-sm text-gray-700 mt-2 line-clamp-2">{book.summary}</p>
              )}
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
};

export default AdminDashboard; 