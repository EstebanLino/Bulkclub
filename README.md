# Workout Tracker - Suivi d'Entraînement

Application web minimaliste pour gérer vos séances d'entraînement hebdomadaires.

## Fonctionnalités

- **Vue hebdomadaire** : Visualisez vos 7 jours de la semaine en un coup d'œil
- **Gestion des séances** : Créez et nommez vos séances d'entraînement
- **Jours de repos** : Planifiez vos jours de récupération
- **Exercices personnalisés** : Ajoutez plusieurs exercices par séance
- **Suivi détaillé** : Gérez le poids, les séries et les répétitions pour chaque exercice
- **Persistance des données** : Vos données sont sauvegardées localement dans votre navigateur
- **Design mobile-first** : Interface optimisée pour mobile et responsive

## Design

- Direction artistique minimaliste et fluide
- Vert clair naturel (#7FB069) pour les jours d'entraînement
- Blanc pour les jours de repos
- Animations douces et transitions fluides
- Interface intuitive et agréable à utiliser

## Technologies

- **HTML5** : Structure sémantique
- **CSS3** : Design responsive et animations
- **JavaScript Vanilla** : Logique applicative sans dépendances

## Utilisation

1. Ouvrez `index.html` dans votre navigateur
2. Cliquez sur un jour de la semaine
3. Choisissez entre "Séance" ou "Repos"
4. Pour une séance :
   - Donnez un nom à votre séance (ex: Push, Pull, Legs)
   - Ajoutez des exercices avec le bouton "+"
   - Renseignez le poids, les séries et les répétitions
5. Enregistrez vos modifications

## Raccourcis clavier

- **Échap** : Fermer la fenêtre de modification
- **Ctrl/Cmd + S** : Sauvegarder la séance

## Stockage

Les données sont automatiquement sauvegardées dans le LocalStorage de votre navigateur :
- Sauvegarde automatique toutes les 30 secondes
- Sauvegarde à chaque enregistrement manuel
- Les données persistent entre les sessions

## Compatibilité

- Navigateurs modernes (Chrome, Firefox, Safari, Edge)
- Responsive : Mobile, tablette et desktop
- Pas de connexion internet requise

## Structure du projet

```
/
├── index.html      # Structure HTML
├── styles.css      # Styles et animations
├── script.js       # Logique applicative
└── README.md       # Documentation
```

## Licence

Projet libre d'utilisation.
