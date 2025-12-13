## Frontend Arcade – Guide de démarrage

Cette application Flask fournit l'interface joueur (authentification, jeu, classement) qui consomme l'API du backend `347_Docker_Final`. Elle peut tourner seule (pour du dev rapide) ou via Docker/Compose aux côtés du backend et de la base de données.

---

### ⚙️ Stack & fonctionnalités
- Flask 3.x, templating Jinja2, sessions sécurisées.
- Assets statiques (CSS/JS) pour l'écran de jeu et le tableau des scores.
- Intégration avec l'API via `requests` (login, création de compte, sauvegarde de scores, leaderboard).
- Basculable DEV/PROD grâce à `BACKEND_URL`.

---

### ✅ Prérequis
- Python ≥ 3.11 (3.13 utilisé dans l'image Docker).
- `pip` et optionnellement `python -m venv`.
- Accès réseau vers l'API (par défaut `http://localhost:8081`).

---

### 🚀 Lancement local (sans Docker)
1. **Créer l'environnement**
	```powershell
	cd frontend
	python -m venv .venv
	.\.venv\Scripts\activate
	pip install -r requirements.txt
	```
2. **Définir l'URL du backend (optionnel)**
	```powershell
	$env:BACKEND_URL = "http://localhost:8081"
	```
3. **Démarrer Flask**
	```powershell
	python src/main.py
	```
4. Ouvrir `http://localhost:5000` (5001 en mode prod si `BACKEND_URL` contient "prod").

> Astuce : en dev, Flask loggue l'URL du backend sélectionnée (`IS_DEV`).

---

### 🐳 Lancement via Docker
**Image seule**
```powershell
cd frontend
docker build -t arcade-frontend .
docker run -p 5000:5000 -e BACKEND_URL=http://host.docker.internal:8081 arcade-frontend
```

**Docker Compose**
Le fichier `docker-compose.yml` à la racine orchestre backend + frontend + base de données. Depuis la racine :
```powershell
docker compose up --build frontend
```

---

### 🔧 Variable d'environnement
| Nom          | Valeur par défaut           | Description                                   |
|--------------|-----------------------------|-----------------------------------------------|
| `BACKEND_URL`| `http://localhost:8081`     | URL de l'API consommée par `requests`.       |

> En prod Compose fournit généralement l'URL interne du service backend (`http://backend:8081`).

---

### 📂 Structure utile
```
frontend/
├─ Dockerfile              # Image Python 3.13 slim
├─ requirements.txt        # Dépendances Flask + requests
└─ src/
	├─ config.py            # Lecture de BACKEND_URL
	├─ main.py              # Routes Flask (login, jeu, leaderboard)
	├─ static/              # CSS/JS/médias
	└─ templates/           # Pages HTML (login, register, game, leaderboard)
```

---

### ❓Dépannage rapide
- **401 lors du login** : vérifier les identifiants et que le backend accepte la requête (logs backend).
- **Erreur réseau** : confirmer `BACKEND_URL`, surtout derrière Docker (`host.docker.internal`).
- **Static non chargés** : en dev, rafraîchir avec `Ctrl+F5` (Flask ne met pas les assets en cache).

---
