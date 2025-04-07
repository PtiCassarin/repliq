import { db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

const initAdminEmails = async () => {
  try {
    const adminEmails = [
      'admin@repliq.com',  // Email de l'administrateur principal
      // Ajoutez d'autres emails d'administrateurs ici si nécessaire
    ];

    await setDoc(doc(db, 'config', 'admin_emails'), {
      emails: adminEmails
    });

    console.log('Collection admin_emails initialisée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la collection admin_emails:', error);
  }
};

export default initAdminEmails; 