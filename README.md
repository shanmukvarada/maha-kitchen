# Maha Kitchen - Firebase Setup Guide

This project uses Firebase for Authentication, Firestore (Database), and Storage.

## Prerequisites

1.  A Google account.
2.  Node.js installed (already handled in this environment).

## Step 1: Create a Firebase Project

1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Click **Add project** and follow the setup wizard.
3.  Disable Google Analytics for simplicity if asked.

## Step 2: Enable Authentication

1.  In the Firebase Console sidebar, click **Build** > **Authentication**.
2.  Click **Get started**.
3.  Select **Email/Password** as a Sign-in method.
4.  Enable **Email/Password** and click **Save**.

## Step 3: Enable Firestore Database

1.  In the sidebar, click **Build** > **Firestore Database**.
2.  Click **Create database**.
3.  Choose a location (e.g., `us-central1`).
4.  Start in **Test mode** (or Production mode, we will update rules later).
5.  Click **Create**.

## Step 4: Enable Storage

1.  In the sidebar, click **Build** > **Storage**.
2.  Click **Get started**.
3.  Start in **Test mode**.
4.  Click **Done**.

## Step 5: Get Configuration Keys

1.  Click the **Project Overview** (gear icon) > **Project settings**.
2.  Scroll down to **Your apps**.
3.  Click the **Web** icon (`</>`).
4.  Register the app (e.g., "FoodDelivery").
5.  Copy the `firebaseConfig` object values.

## Step 6: Configure Environment Variables

1.  Open `.env` (or create it from `.env.example`).
2.  Fill in the values from your Firebase config:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

## Step 7: Set Security Rules

1.  Go to **Firestore Database** > **Rules**.
2.  Copy the content of `firestore.rules` from this project and paste it there.
3.  Click **Publish**.
4.  (Optional) Do the same for Storage rules if you want strict security.

## Step 8: Create an Admin User

1.  Sign up in the app with `admin@example.com`.
2.  Go to **Firestore Database** > **Data**.
3.  Find the `users` collection.
4.  Find the document for the user you just created.
5.  Change the `role` field from `"user"` to `"admin"`.
6.  Refresh the app. You should now see the "Admin" link in the navbar.

## Running the App

The app should be running. If you see "Firebase Not Configured" messages, ensure your `.env` file is set up correctly and you have restarted the dev server.
