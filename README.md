# Quetzal — Chaussures de ville

Site e-commerce Quetzal. Le catalogue (produits, prix, stock) est lu en
direct depuis un script Google Apps Script relié à un Google Sheet, et les
commandes décrémentent le vrai stock dans la feuille.

## Développement local

```bash
npm install
npm run dev
```

Ouvre ensuite l'adresse affichée dans le terminal (en général
http://localhost:5173).

## Déploiement sur GitHub Pages

### Option recommandée — automatique (GitHub Actions)

1. Crée un dépôt GitHub et pousse ce projet dedans :
   ```bash
   git init
   git add .
   git commit -m "Site Quetzal"
   git branch -M main
   git remote add origin https://github.com/TON-PSEUDO/NOM-DU-REPO.git
   git push -u origin main
   ```
2. Sur GitHub, va dans **Settings → Pages**, et sous "Build and deployment",
   choisis la source **GitHub Actions**.
3. Ouvre `vite.config.js` et vérifie la valeur de `base` :
   - Si l'URL de ton site sera `https://TON-PSEUDO.github.io/NOM-DU-REPO/`,
     mets `base: "/NOM-DU-REPO/"`.
   - Si ton dépôt s'appelle exactement `TON-PSEUDO.github.io`, laisse
     `base: "/"`.
4. À chaque `git push` sur `main`, le site se reconstruit et se republie
   automatiquement (voir `.github/workflows/deploy.yml`).

### Option manuelle (gh-pages)

```bash
npm install
npm run build
npm run deploy
```

Puis, dans **Settings → Pages**, choisis la branche `gh-pages` comme source.

## Connexion au Google Sheet

L'URL du script Apps Script (lecture du catalogue + écriture du stock) est
définie dans `src/App.jsx`, constante `STOCK_API_URL`. Pour changer de
feuille ou redéployer le script, mets à jour cette constante avec la
nouvelle URL `/exec`.
