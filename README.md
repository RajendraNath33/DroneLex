# DroneLex

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-stx9zka6)

## Firebase setup

Add these variables to `.env` using the values from your Firebase web app configuration:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Enable the Google and Email/Password sign-in providers in the Firebase console, create a Cloud Firestore database, and publish the rules in `firestore.rules`.
