# 🔧 Troubleshooting

Having trouble? Here are solutions to the most common issues reported by the community.

## 🛑 Common Errors

### 1. `SQLITE_CANTOPEN: unable to open database file`
This usually means the app doesn't have permissions to write to the folder or the path in `DATABASE_FILE` is incorrect.
*   **Fix**: Ensure you are using the `docker-compose.yml` provided in the [Installation Guide](Installation-Guide).
*   **Fix**: Make sure the `./data` folder exists in your project directory on your host machine.

### 2. Website not loading (`ERR_CONNECTION_REFUSED`)
The container is running, but you cannot see the website.
*   **Fix**: Ensure no other application is using port `3000` on your computer.
*   **Fix**: Check if Docker Desktop is actually running.
*   **Check logs**: Run `docker logs holostack_app` to see if there are any errors during startup.

### 3. Images are not loading
*   **Fix**: HoloStack requires an internet connection to fetch card images from TCGdex and PokéAPI. Make sure your container has internet access.
*   **Fix**: Some firewall/ad-blockers might block `images.pokemontcg.io`. Try disabling them or whitelisting the domain.

### 4. Database Migrations Collide
If you see an error saying `table users already exists` during startup:
*   **Note**: We have implemented a "Lock" system to handle this automatically in recent versions.
*   **Fix**: Just restart the container: `docker-compose restart`. It should fix itself on the second attempt if a race condition occurred.

---

## 📋 How to get more help

If your problem isn't listed here:
1.  **Check existing Issues**: Someone might have already solved it in the [Issues Tracker](https://github.com/sgonzalezh/holostack-feedback/issues).
2.  **Ask the Community**: Start a conversation in the [Discussions](https://github.com/sgonzalezh/holostack-feedback/discussions) tab.
3.  **Provide Logs**: When asking for help, please provide the output of:
    ```bash
    docker logs holostack_app
    ```
