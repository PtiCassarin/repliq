# Repliq - Application de Gestion de Livres Numériques

Cette application permet aux utilisateurs de récupérer une version numérique d'un livre qu'ils possèdent déjà en version physique, en utilisant leur ticket de caisse comme preuve d'achat.

## Fonctionnalités

### Côté Client
- Upload de tickets de caisse
- Visualisation des demandes en cours
- Accès à une bibliothèque personnelle de livres numériques

### Côté Admin
- Gestion des demandes utilisateurs
- Administration des livres disponibles
- Validation des tickets de caisse

## Technologies Utilisées

- React.js
- Firebase (Authentication, Firestore)
- Tailwind CSS
- React Router

## Installation

1. Clonez le repository
```bash
git clone [URL_DU_REPO]
cd my-project
```

2. Installez les dépendances
```bash
npm install
```

3. Configurez les variables d'environnement
- Copiez le fichier `.env.example` en `.env`
- Remplissez les variables avec vos informations Firebase

4. Lancez l'application
```bash
npm start
```

## Configuration Firebase

1. Créez un projet sur [Firebase Console](https://console.firebase.google.com)
2. Activez l'authentification par email/mot de passe
3. Créez une base de données Firestore
4. Configurez les règles de sécurité Firestore :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /books/{bookId} {
      allow read: if true;
      allow write: if request.auth != null && 
                  request.auth.token.email.matches('.*admin@.*');
    }
    
    match /requests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                   !request.auth.token.email.matches('.*admin@.*');
      allow update: if request.auth != null && 
                   request.auth.token.email.matches('.*admin@.*');
    }
  }
}
```

## Comptes de Test

- Admin : admin@repliq.com / admin123
- Client : client@repliq.com / client123

## Contribution

Les pull requests sont les bienvenues. Pour les changements majeurs, veuillez d'abord ouvrir une issue pour discuter de ce que vous aimeriez changer.
