<div align="center">

  <img src="https://raw.githubusercontent.com/SergioXp/HoloStack/main/banner.png" alt="HoloStack Banner" width="100%" />
  
  # HoloStack
  
  **The Next-Gen Pokémon TCG Collection Manager**
  
  [![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/SergioXp/HoloStack?style=for-the-badge&color=blue)](https://github.com/SergioXp/HoloStack/releases)
  [![Docker Pulls](https://img.shields.io/docker/pulls/sgonzalezh/holostack?style=for-the-badge&color=azure)](https://hub.docker.com/r/sgonzalezh/holostack)
  [![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Docker-slate?style=for-the-badge)](https://github.com/SergioXp/HoloStack/releases)

  <p align="center">
    <b>Track. Analyze. Master your Collection.</b><br>
    HoloStack is the definitive tool for serious collectors, combining professional inventory management with real-time market analytics.
  </p>

  [📥 Download Desktop App](#-get-started) • [🐳 Run with Docker](#-self-hosted-docker) • [💬 Join Community](../../discussions)

</div>

---

## 🔥 Why HoloStack?

Forget spreadsheets and slow websites. HoloStack is built for speed, aesthetics, and data sovereignty. Whether you have 100 cards or 100,000, we've got you covered.

### 📊 Professional Market Analytics
*   **Real-time Pricing:** Live data from **TCGPlayer** and **Cardmarket**.
*   **Portfolio Tracking:** Visualize your collection's value over time with interactive interactive charts.
*   **Deal Spotter:** Automatically identify cards selling below market value.

### 🗂️ Advanced Inventory Management
*   **Infinite Hierarchy:** Organize by Folders, Binders, or custom tags.
*   **Bulk Entry Mode:** Add hundreds of cards in minutes using our optimized rapid-entry UI.
*   **Smart Search:** Filter by Artist, Rarity, Set, Holo pattern, and more instantly.

### 🌍 Universal Access
*   **Cross-Platform:** Native apps for **Windows, macOS, and Linux**.
*   **Self-Hosted:** Deploy your own instance with Docker. Your data, your rules.
*   **Offline First:** The desktop app works seamlessly even without an internet connection (price sync resumes when online).

---

## 📸 Screenshots

| Dashboard & Analytics | Collection View |
|:---:|:---:|
| <img src="https://raw.githubusercontent.com/SergioXp/HoloStack/main/screenshots/dashboard.png" alt="Dashboard" width="400"/> | <img src="https://raw.githubusercontent.com/SergioXp/HoloStack/main/screenshots/collection.png" alt="Collection" width="400"/> |
| **Card Details & Pricing** | **Bulk Import Tools** |
| <img src="https://raw.githubusercontent.com/SergioXp/HoloStack/main/screenshots/card-detail.png" alt="Card Detail" width="400"/> | <img src="https://raw.githubusercontent.com/SergioXp/HoloStack/main/screenshots/bulk.png" alt="Bulk Import" width="400"/> |

> *Note: Place your screenshots in a `screenshots` folder in the repo to make these appear!*

---

## 🚀 Get Started

### 🖥️ Desktop Application (Recommended)
The easiest way to start. Download the installer, run it, and start collecting within seconds.

[![Download for Windows](https://img.shields.io/badge/Windows-Download-blue?style=for-the-badge&logo=windows)](../../releases/latest)
[![Download for macOS](https://img.shields.io/badge/macOS-Download-white?style=for-the-badge&logo=apple)](../../releases/latest)
[![Download for Linux](https://img.shields.io/badge/Linux-Download-orange?style=for-the-badge&logo=linux)](../../releases/latest)

1. Go to the **[Releases Page](../../releases/latest)**.
2. Download the file for your OS (`.exe`, `.dmg`, or `.AppImage`).
3. Install and launch!

### 🐳 Self-Hosted (Docker)
Ideally for running on a NAS (Synology, Unraid) or a home server (Raspberry Pi).

```yaml
version: '3.8'
services:
  holostack:
    image: sgonzalezh/holostack:latest
    container_name: holostack
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```

```bash
docker compose up -d
```

---

## 🛠️ Features at a Glance

*   ✅ **TCGdex Integration:** Full database of every English & International set.
*   ✅ **Proxy Generator:** Create high-quality print sheets for playtesting.
*   ✅ **Scan & Import:** Import collections from CSV or Cardmarket exports.
*   ✅ **Wishlist System:** Track cards you want to buy and set target prices.
*   ✅ **Theme Support:** Dark mode, Light mode, and Type-based themes (Fire, Water, Grass...).
*   ✅ **Multi-Language:** Interface available in English and Spanish.

---

## 🤝 Support & Community

HoloStack is an open community project where your feedback matters.

*   🐛 **Found a bug?** [Open an Issue](../../issues)
*   💡 **Have an idea?** [Start a Discussion](../../discussions)
*   ⭐ **Love the app?** Give us a star!

---

<p align="center">
  <sub>Developed with ❤️ by <a href="https://github.com/SergioXp">SergioXp</a></sub><br>
  <sub><i>Pokémon and Pokémon Character Names are trademarks of Nintendo. HoloStack is not affiliated with Nintendo, The Pokémon Company, or GAME FREAK.</i></sub>
</p>
