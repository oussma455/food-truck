"use client";

import React, { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    console.log("OneSignal Provider: Tentative d'initialisation avec App ID:", appId ? appId.substring(0, 8) + "..." : "NON TROUVÉ");
    
    if (appId) {
      OneSignal.init({
        appId: appId,
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        // On force l'utilisation de l'origine pour correspondre à la config OneSignal
        serviceWorkerParam: { scope: '/' },
        debug: true,
        notifyButton: {
          enable: false,
        } as any,
      }).then(() => {
        console.log("OneSignal: Initialisé avec succès sur " + window.location.origin);
      }).catch(err => {
        console.error("OneSignal: Erreur d'initialisation:", err);
      });
    }
 else {
      console.error("OneSignal: NEXT_PUBLIC_ONESIGNAL_APP_ID est manquant dans l'environnement");
    }
  }, []);

  return <>{children}</>;
}
