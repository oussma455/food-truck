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
        notifyButton: {
          enable: false,
        } as any, // Bypass strict type check for partial notifyButton config
      }).then(() => {
        console.log("OneSignal Initialized");
      });
    }
  }, []);

  return <>{children}</>;
}
