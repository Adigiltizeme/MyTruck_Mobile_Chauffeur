# 📱 My Truck - Application Mobile Chauffeur

**Version** : 0.2.0
**Date** : 28 janvier 2026
**Statut** : Phase 2 Complétée ✅

---

## 🎯 Description

Application mobile React Native pour les chauffeurs My Truck permettant de gérer le workflow complet de livraison en 2 phases :

1. **Retrait** : Enlèvement de la commande au magasin
2. **Livraison** : Livraison de la commande au client

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 20+ installé
- Smartphone Android ou iOS
- Application **Expo Go** installée sur le téléphone

### Installation

```bash
# Installer les dépendances
cd mobile-chauffeur
npm install

# Démarrer le serveur Expo
npx expo start
```

### Tester sur téléphone

1. Ouvrir l'app **Expo Go** sur votre smartphone
2. Scanner le QR code affiché dans le terminal
3. L'application se lancera automatiquement

---

## ✅ Fonctionnalités Implémentées

### Phase 1 : Infrastructure ✅

- ✅ Projet Expo TypeScript initialisé
- ✅ Dépendances installées (React Navigation, Axios, Expo modules)
- ✅ Charte graphique My Truck configurée
- ✅ Service API avec interceptors JWT
- ✅ Service Authentification
- ✅ Service Commandes (CRUD + photos + rapports)

### Phase 2 : Authentification & Navigation ✅

- ✅ **AuthContext** : Gestion état authentification global
- ✅ **React Navigation** : Stack Navigator configuré
- ✅ **Écran Login** : Connexion chauffeur avec validation
- ✅ **Écran Dashboard** : Liste des commandes assignées
- ✅ **Protected Routes** : Affichage conditionnel selon authentification

---

## 📂 Structure du Projet

```dropdown
mobile-chauffeur/
├── constants/
│   ├── Colors.ts              ✅ Charte graphique My Truck
│   ├── API.ts                 ✅ Configuration backend
│   └── Types.ts               ✅ Types TypeScript
├── services/
│   ├── api.service.ts         ✅ Axios + interceptors JWT
│   ├── auth.service.ts        ✅ Login/logout
│   └── commandes.service.ts   ✅ CRUD commandes
├── contexts/
│   └── AuthContext.tsx        ✅ Context authentification
├── screens/
│   ├── LoginScreen.tsx        ✅ Écran connexion
│   └── DashboardScreen.tsx    ✅ Liste commandes
├── components/                ⏳ Composants réutilisables (à créer)
├── hooks/                     ⏳ Hooks personnalisés (à créer)
├── utils/                     ⏳ Utilitaires (à créer)
└── App.tsx                    ✅ Point d'entrée avec navigation
```

---

## 🎨 Design System

### Couleurs My Truck

```typescript
Primary (Orange) : #FF6B35   // Boutons, headers
Secondary (Vert) : #4CAF50   // Succès, livraison
Danger (Rouge)   : #F44336   // Erreurs, annulation
Info (Bleu)      : #2196F3   // Informations
```

### Phases Visuelles

- **Phase Retrait** : Thème Orange (#FF6B35)
- **Phase Livraison** : Thème Vert (#4CAF50)

---

## 🔐 Authentification

### Backend

- **URL** : `https://my-truck-api-production.up.railway.app/api/v1`
- **Endpoint Login** : `POST /auth/login`
- **Token** : JWT stocké dans AsyncStorage (clé: `authToken`)

### Test Login

Pour tester, utilisez les credentials d'un chauffeur existant dans la base de données.

**Exemple** :

```json
{
  "email": "chauffeur@mytruck.com",
  "password": "votreMotDePasse"
}
```

> ⚠️ **Important** : Seuls les utilisateurs avec `role: 'chauffeur'` peuvent se connecter.

---

## 📱 Écrans Disponibles

### 1. Login Screen

- ✅ Logo My Truck
- ✅ Input Email
- ✅ Input Password (sécurisé)
- ✅ Bouton "Se Connecter"
- ✅ Gestion erreurs
- ✅ Loading state

### 2. Dashboard Screen

- ✅ Header avec nom chauffeur
- ✅ Bouton déconnexion
- ✅ Liste commandes (FlatList)
- ✅ Cards avec infos commandes :
  - N° commande
  - Magasin → Client
  - Heures retrait/livraison
  - Badge statut (coloré)
- ✅ Pull-to-refresh
- ✅ État vide ("Aucune commande")

### 3. Retrait Screen ⏳ (À créer)

- Infos magasin (nom, téléphone, adresse)
- Bouton navigation GPS
- Liste articles
- Photo enlèvement
- Commentaire (optionnel)
- Signatures (Magasin + Chauffeur)
- Bouton "Confirmer Enlèvement"

### 4. Livraison Screen ⏳ (À créer)

- Infos client (nom, téléphone, adresse)
- Bouton navigation GPS
- Liste articles
- Photo livraison
- Commentaire (optionnel)
- Signatures (Client + Chauffeur)
- Bouton "Confirmer Livraison"

---

## 🔄 Workflow Complet

### État Initial

```dropdown
statutCommande: "Confirmée"
statutLivraison: "EN_ATTENTE"
```

### Phase 1 : Retrait

1. Chauffeur ouvre commande depuis Dashboard
2. Affichage écran Retrait avec infos magasin
3. Navigation GPS vers magasin
4. Photo de l'enlèvement
5. Commentaire (optionnel)
6. Signatures Magasin + Chauffeur
7. Clic "Confirmer Enlèvement"
   - Upload photo (type: ENLEVEMENT)
   - Création rapport avec signatures
   - Update `statutLivraison: "EN_COURS"`
   - Navigation vers Phase 2

### Phase 2 : Livraison

1. Affichage écran Livraison avec infos client
2. Navigation GPS vers client
3. Photo de la livraison
4. Commentaire (optionnel)
5. Signatures Client + Chauffeur
6. Clic "Confirmer Livraison"
    - Upload photo (type: LIVRAISON)
    - Création rapport avec signatures
    - Update `statutLivraison: "LIVRE"`
    - Update `statutCommande: "Livrée"`
    - Retour Dashboard

---

## 🛠️ Scripts Disponibles

```bash
# Démarrer serveur Expo
npm start

# Démarrer avec cache clear
npm start -- --clear

# Build Android APK (local)
npm run android

# Build iOS (Mac uniquement)
npm run ios

# Run tests
npm test

# Linting
npm run lint
```

---

## 📊 Progress

**Phase 1 : Infrastructure** ✅ 100%
**Phase 2 : Auth & Navigation** ✅ 100%
**Phase 3 : Retrait/Livraison** ⏳ 0%
**Phase 4 : GPS Background** ⏳ 0%
**Phase 5 : Polish & Build** ⏳ 0%

**Global : 50%** (2/4 phases majeures)

---

## 🐛 Debugging

### Problème : "Network Error" lors du login

**Solution** : Vérifier que le backend Railway est accessible

```bash
curl https://mytruckprojectbackend-production.up.railway.app/api/v1/auth/login
```

### Problème : "Token expired"

**Solution** : Se reconnecter. Le token JWT est stocké dans AsyncStorage.

### Problème : Écran blanc au démarrage

**Solution** : Vérifier les logs Expo dans le terminal

```bash
npx expo start --clear
```

---

## 📝 API Backend

### Endpoints Utilisés

#### Auth

```dropdown
POST /auth/login
Body: { email, password }
Response: { token, user }
```

#### Commandes Chauffeur

```dropdown
GET /commandes/chauffeur/:chauffeurId
Response: Commande[]
```

#### Détail Commande

```dropdown
GET /commandes/:id
Response: Commande (avec relations)
```

#### Upload Photo

```dropdown
POST /commandes/:id/photos-livraison
Body: FormData { photo: File, type: "ENLEVEMENT" | "LIVRAISON" }
```

#### Créer Rapport

```dropdown
POST /commandes/:id/rapports
Body: {
  type: "ENLEVEMENT" | "LIVRAISON",
  commentaire?: string,
  signatureChauffeur?: string (base64),
  signatureMagasin?: string,
  signatureClient?: string
}
```

---

## 🚀 Prochaines Étapes

### Phase 3 : Workflow Retrait/Livraison

1. Créer écran `RetraitScreen.tsx`
2. Créer écran `LivraisonScreen.tsx`
3. Créer composants réutilisables :
   - `CameraModal.tsx`
   - `SignatureCanvas.tsx`
   - `PhoneButton.tsx`
   - `NavigationButton.tsx`
4. Ajouter navigation Dashboard → Retrait → Livraison

### Phase 4 : GPS Background

1. Créer `services/gps.service.ts`
2. Implémenter Background Task (Expo Task Manager)
3. Envoyer position toutes les 30s via WebSocket
4. Démarrer automatiquement quand `statutLivraison === "EN_COURS"`

### Phase 5 : Polish & Build

1. Icône app + Splash screen
2. Tests sur device Android
3. Gestion erreurs complète
4. Build APK production

---

## 📚 Documentation

- **Architecture** : `MOBILE_APP_ARCHITECTURE.md`
- **Progress** : `PROGRESS.md`
- **Backend API** : Voir documentation NestJS dans `my-truck-api/`

---

## 👨‍💻 Développement

**Tech Stack** :

- React Native + Expo SDK 52
- TypeScript
- React Navigation 6
- Axios (HTTP)
- AsyncStorage (cache local)
- Expo Camera, Location, Task Manager

**Conventions** :

- Code en TypeScript strict
- Commentaires JSDoc pour fonctions complexes
- Styles StyleSheet (pas de styled-components)
- Logs console avec emojis 🎨

---

## 📞 Support

Pour toute question technique, consulter :

- Documentation Expo : <https://docs.expo.dev/>
- React Navigation : <https://reactnavigation.org/>
- Backend My Truck : `my-truck-api/README.md`

---

## My Truck © 2026 - Version Mobile Chauffeur
