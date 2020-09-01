import webpush from "web-push";
import { config } from "../config";
import { isFirebaseAvailable, isWebPushAvailable } from "./helpers";
import admin from "firebase-admin";

const initPushSystem = () => {
    if (!isWebPushAvailable() && !isFirebaseAvailable()) return;

    if (isWebPushAvailable())
        webpush.setVapidDetails(config.webPush.mailTo, config.webPush.publicKey, config.webPush.privateKey);

    if (isFirebaseAvailable()) {
        admin.initializeApp({
            credential: admin.credential.cert(config.firebase.credential),
            databaseURL: config.firebase.databaseUrl
        });
    }

};

export default initPushSystem;
