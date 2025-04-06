import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const books = [
  {
    title: "Le Petit Prince",
    author: "Antoine de Saint-Exupéry",
    summary: "Un pilote d'avion, qui s'est écrasé dans le désert du Sahara, fait la rencontre d'un mystérieux petit prince venu des étoiles.",
    ebookUrl: "https://example.com/petit-prince.pdf",
    isbn: "978-2-07-040850-4",
    coverImage: "https://m.media-amazon.com/images/I/81UUK+qU7RL._AC_UF1000,1000_QL80_.jpg"
  },
  {
    title: "1984",
    author: "George Orwell",
    summary: "Dans un monde totalitaire, Winston Smith tente de maintenir son intégrité face à un régime oppressif qui contrôle non seulement les actions mais aussi les pensées de ses citoyens.",
    ebookUrl: "https://example.com/1984.pdf",
    isbn: "978-2-07-036822-8",
    coverImage: "https://m.media-amazon.com/images/I/91SZSW8qSsL._AC_UF1000,1000_QL80_.jpg"
  }
];

export async function seedBooks() {
  try {
    for (const book of books) {
      await addDoc(collection(db, 'books'), {
        ...book,
        createdAt: new Date(),
      });
      console.log(`Livre ajouté : ${book.title}`);
    }
    console.log('Tous les livres ont été ajoutés avec succès !');
  } catch (error) {
    console.error('Erreur lors de l\'ajout des livres :', error);
  }
} 