# 🚀 Installation Guide

Getting HoloStack running is extremely simple thanks to Docker. Follow these steps to set up your personal collection manager.

## 📋 Prerequisites

Before starting, make sure you have **Docker Desktop** installed on your system:
*   [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

## ⚡ Quick Setup (Docker Compose)

The recommended way to run HoloStack is using `docker-compose`. This ensures your data is persisted even if the container is updated.

### 1. Create a Project Folder
Create a folder on your computer where you want to keep your data (e.g., `holostack`).

### 2. Create the `docker-compose.yml` file
Inside that folder, create a file named `docker-compose.yml` and paste the following:

```yaml
services:
  app:
    image: sgonzalezh/holostack:latest
    container_name: holostack_app
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_FILE=/app/data/sqlite.db
      - APP_MODE=LOCAL
      - NEXTAUTH_SECRET=choose_your_own_secret_key
      - NEXTAUTH_URL=http://localhost:3000
```

### 3. Launch the App
Open a terminal in that folder and run:

```bash
docker-compose up -d
```

### 4. Access the Dashboard
Open your browser and go to: **[http://localhost:3000](http://localhost:3000)**

---

## ⚙️ Environment Variables Explained

| Variable | Description | Default / Recommended |
| :--- | :--- | :--- |
| `APP_MODE` | Set to `LOCAL` for private use (no login needed). Set to `SERVER` for multi-user authentication. | `LOCAL` |
| `DATABASE_FILE` | Path to the SQLite database inside the container. | `/app/data/sqlite.db` |
| `NEXTAUTH_SECRET` | A secret key used for session encryption. Change this for security! | `any_random_string` |
| `NEXTAUTH_URL` | The URL where the app is accessible. | `http://localhost:3000` |

---

## 🔄 Updating HoloStack

Whenever we release a new version, updating is as easy as running:

```bash
docker-compose pull
docker-compose up -d
```
Your database and settings will remain safe in the `./data` folder.
