# PRAFUL DANCE APP

Une application en français pour préparer les placements de danseurs, aux couleurs de Parvati India. Responsive, utilisable à la souris, au doigt et au clavier.

## Fonctionnalités

- Effectif de 1 à 40 danseurs.
- 7 formations : deux lignes, quinconce, une ligne, V, demi-cercle, cercle et diagonale.
- Deux lignes centrées, avec un danseur sur l’axe central pour un effectif impair.
- Troupe unique ou 2 à 6 groupes équilibrés, chacun pouvant être divisé en sous-groupes A/B.
- Affectation individuelle des prénoms, groupes et sous-groupes.
- Déplacement libre, flèches du clavier (Maj pour un pas plus grand), miroir horizontal, inversion verticale scène/public (vue danseur) et annulation des 50 dernières modifications de scène.
- Jusqu’à 60 tableaux enregistrés, rechargeables comme base d’un nouveau tableau.
- Export PNG de la scène, sauvegarde et import du projet complet en JSON.
- Enregistrement automatique dans le navigateur de l’appareil.
- Logo Parvati India fourni et inclus localement.

## Démarrer sur votre Mac

Dans le terminal du dossier déjà cloné :

```bash
git pull origin main
npm run dev
```

Ouvrez `http://localhost:3000`. Node.js 20 ou plus récent est requis. L’application n’a aucune dépendance npm à installer. L’extension Live Server de VS Code peut aussi servir le dossier `public/`.

## Déployer sur Vercel

Importez le dépôt `PRAFUL33290/praful-dance-app` comme nouveau projet Vercel. La configuration `vercel.json` définit :

| Réglage | Valeur |
| --- | --- |
| Framework | Other |
| Root Directory | Racine du dépôt |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Aucune variable d’environnement, clé API ou base de données n’est nécessaire. Le projet est statique ; aucun serveur Node n’est exécuté en production.

## Utilisation

1. Renseignez l’effectif. Un changement d’effectif redistribue les groupes et les positions, tout en conservant les prénoms des danseurs restants.
2. Choisissez les groupes et éventuellement les sous-groupes. Les effectifs sont équilibrés automatiquement.
3. Choisissez une formation : elle s’applique dans chaque groupe ou sous-groupe actif.
4. Déplacez les pastilles. Par défaut, le public est en bas et le fond de scène en haut. Le bouton ⇅ inverse verticalement la scène pour voir le placement dans le sens du danseur (public en haut). G/D correspondent aux côtés de l’image, pas aux côtés du danseur.
5. Cliquez sur un danseur pour changer son prénom ou son groupe. Une affectation individuelle conserve sa position ; le bouton ↻ replace ensuite tous les groupes si nécessaire.
6. Donnez un nom à la scène et enregistrez le tableau. L’enregistrement ajoute un nouveau tableau ; il ne remplace pas le précédent.
7. Exportez votre projet JSON pour le transférer vers un autre appareil ou conserver une copie indépendante.

Les placements proposés sont une base géométrique. Vérifiez les distances réelles selon la scène et la chorégraphie. Les grandes formations peuvent avoir des pastilles proches, particulièrement sur téléphone.

## Données et limites

Les prénoms et tableaux restent dans le stockage local de ce navigateur. Ils ne sont pas synchronisés entre appareils et peuvent être perdus si les données du navigateur sont effacées. Le mode privé ou un stockage saturé peut empêcher l’enregistrement : un message invite alors à télécharger le projet. L’import JSON remplace le projet local après confirmation. Aucun compte utilisateur n’est requis. Les polices Google Fonts utilisent une police système de repli sans connexion.

## Vérification et structure

```bash
npm test
npm run build
```

- `public/index.html` : structure accessible en français.
- `public/style.css` : interface responsive.
- `public/formations.js` : calcul des placements et validation des projets importés.
- `public/app.js` : interactions, sauvegardes et export.
- `tests/formations.test.js` : vérification des effectifs, centrage, groupes et imports.
- `scripts/build.js` : copie du site statique vers `dist/`.
- `scripts/serve.js` : serveur local de développement.

Les tests automatisés portent sur les calculs de placement et la validation des projets. Les interactions tactiles et le plein écran dépendent du navigateur et doivent être vérifiés sur les appareils utilisés en répétition.
