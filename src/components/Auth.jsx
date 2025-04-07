import { useState } from 'react';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const initializeAdminEmails = async () => {
    try {
      const configRef = doc(db, 'config', 'admin_emails');
      const configDoc = await getDoc(configRef);
      
      if (!configDoc.exists()) {
        console.log('Initialisation de la collection admin_emails');
        await setDoc(configRef, {
          emails: ['admin@repliq.com']
        });
        console.log('Collection admin_emails initialisée avec succès');
      } else {
        // Vérifier si emails est un tableau, sinon le convertir
        const currentData = configDoc.data();
        if (typeof currentData.emails === 'string') {
          console.log('Conversion de emails en tableau');
          await setDoc(configRef, {
            emails: [currentData.emails]
          });
          console.log('Collection admin_emails mise à jour avec succès');
        } else {
          console.log('Collection admin_emails existe déjà avec la bonne structure:', currentData);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de admin_emails:', error);
    }
  };

  const checkAdminStatus = async (email) => {
    try {
      const configRef = doc(db, 'config', 'admin_emails');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const adminEmails = configDoc.data().emails || [];
        console.log('Emails administrateurs:', adminEmails);
        return adminEmails.includes(email);
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut admin:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Tentative de connexion avec:', email);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Connexion réussie:', user);
      
      // Si c'est le premier admin qui se connecte, initialiser la collection
      if (email === 'admin@repliq.com') {
        await initializeAdminEmails();
      }
      
      // Vérifier le rôle de l'utilisateur
      const isAdminUser = await checkAdminStatus(user.email);
      console.log('Est administrateur:', isAdminUser);
      
      const userData = {
        email: user.email,
        role: isAdminUser ? 'admin' : 'client',
        uid: user.uid
      };
      
      console.log('Données utilisateur:', userData);
      onLogin(userData);

      // Redirection en fonction du rôle
      if (isAdminUser) {
        navigate('/requests');
      } else {
        navigate('/new-request');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      let errorMessage = 'Une erreur est survenue lors de la connexion.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Adresse email invalide.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Aucun compte ne correspond à cet email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Mot de passe incorrect.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = `Erreur: ${error.message}`;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion {isAdmin ? 'Admin' : 'Client'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isAdmin ? 'admin@repliq.com' : 'client@repliq.com'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Adresse email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Se connecter
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsAdmin(!isAdmin);
              setEmail(isAdmin ? 'client@repliq.com' : 'admin@repliq.com');
              setPassword('');
              setError('');
            }}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Passer en mode {isAdmin ? 'Client' : 'Admin'}
          </button>
        </div>
      </div>
    </div>
  );
} 