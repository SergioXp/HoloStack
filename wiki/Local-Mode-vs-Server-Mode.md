# ⚙️ Local Mode vs Server Mode

HoloStack can be configured to run in two different modes depending on how you plan to use it. This is controlled by the `APP_MODE` environment variable.

## 🏠 LOCAL Mode (Default)
**Set `APP_MODE=LOCAL`**

This mode is designed for the individual collector running the app on their own computer.

*   **No Login Required**: The app automatically recognizes you as the "Local Admin".
*   **Privacy**: Best for personal use where no one else has access to your browser.
*   **Ease of Access**: Just open the URL and you are in. No passwords to remember.
*   **Ideal for**: 99% of users sitting at their desks managing their personal binders.

## 🌐 SERVER Mode
**Set `APP_MODE=SERVER`**

This mode is designed for users who want to host HoloStack on a public server or VPS and want to access it from anywhere securely.

*   **Authentication**: Users must log in with an email and password.
*   **Multi-user Support**: Different users can have their own private collections on the same server.
*   **Enhanced Security**: Protects your data behind a login screen.
*   **Proxy Support**: Safely handle requests through a central security layer.
*   **Ideal for**: Collectors who want to share a server with friends or access their data from a mobile phone while away from home.

---

### How to switch?
Simply update your `docker-compose.yml` file:

```yaml
environment:
  - APP_MODE=SERVER # Or LOCAL
```

Then restart the container:
```bash
docker-compose up -d
```
