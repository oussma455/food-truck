"use client";

import React, { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (appId) {
      OneSignal.init({
        appId: appId,
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: 'OneSignalSDKWorker.js',
        notifyButton: {
          enable: false,
        } as any,
      }).then(() => {
        console.log("OneSignal Initialized");
        // Optionnel : vérifier si l'utilisateur est déjà abonné
        if (OneSignal.Notifications.permission) {
          console.log("Permission statut:", OneSignal.Notifications.permissionNative);
        }
      });
    }
  }, []);

  return <>{children}</>;
}
