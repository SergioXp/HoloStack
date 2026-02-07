# HoloStack - Changelog

All notable changes to HoloStack are documented here.

---

## [1.1.3] - 2026-02-07

### 🔄 Updates & Stability
- **Smarter Updates**: Fixed the update checker to stop nagging you when you're already on the latest version.
- **Reliable Backups**: Resolved an issue where importing backups on a fresh install would fail due to missing card data.
- **Docker Fixes**: Improved Docker build process to be more resilient against network timeouts.
- **Changelog**: Fixed visual glitches in the changelog display for some languages.

## [1.1.1] - 2026-01-26

### Quality & Testing
- Improved automated testing to catch bugs before they reach you
- Better error logging for faster issue resolution
- Enhanced stability across all platforms

---

## [1.1.0] - 2026-01-26

### Desktop Stability
- Redesigned startup process for faster, more reliable launches
- Fixed freezing and flickering issues on some systems
- Improved database communication to ensure your data is always safe
- Smarter installer that configures everything automatically

---

## [1.0.3] - 2026-01-26

### Database & Sync Fixes
- **Fixed**: Critical bug where cards wouldn't import (missing `attacks` column)
- The app now auto-repairs database issues on startup
- Improved network stability during large syncs

---

## [1.0.2] - 2026-01-22

### Startup Fix
- Fixed an issue where the desktop app couldn't find the database on some systems
- Improved health checks during startup

---

## [1.0.1] - 2026-01-21

### Hotfix
- Fixed a critical bug that prevented the desktop app from starting on Windows and Mac

---

## [1.0.0] - 2026-01-20

### 🎉 Initial Public Release

**Desktop App**
- Native app for Windows, Mac, and Linux
- Offline-first: all your data stays on your computer
- Auto-update notifications

**Collection Management**
- Create manual or automatic collections
- Predefined templates (Original 151, Charizard Hunter, etc.)
- Binder view with realistic album pages
- Table view for quick inventory management

**Market Intelligence**
- Real-time prices from Cardmarket and TCGPlayer
- Portfolio value tracking with currency conversion
- Wishlist with priority levels
- Budget tracking with monthly carry-over

**Tools**
- Bulk entry for fast inventory input
- Cardmarket order importer
- Duplicate detection dashboard
- Proxy generator for printing test cards

**Infrastructure**
- Full English and Spanish support
- Docker deployment option
- Automatic backups (JSON export/import)

---

## Links

- **Download**: [GitHub Releases](https://github.com/SergioXp/HoloStack/releases)
- **Docker**: `docker pull sgonzalezh/holostack:latest`
- **Report Issues**: [GitHub Issues](https://github.com/SergioXp/HoloStack/issues)
