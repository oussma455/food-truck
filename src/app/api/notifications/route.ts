import * as OneSignal from 'onesignal-node';
import { NextResponse } from 'next/server';

export async function POST() {
  const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const API_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!APP_ID || !API_KEY) {
    return NextResponse.json(
      { error: 'OneSignal credentials are not configured' },
      { status: 500 }
    );
  }

  const client = new OneSignal.Client(APP_ID, API_KEY);

  const notification = {
    contents: {
      en: 'The Gourmet Truck is now OPEN! 🔔 Come and grab your delicious sandwich!',
      fr: 'Le Gourmet Truck est maintenant OUVERT ! 🔔 C\'est l\'heure de commander votre sandwich !',
    },
    headings: {
      en: 'Gourmet Truck Open!',
      fr: 'Gourmet Truck Ouvert !',
    },
    included_segments: ['All'],
    // Custom sound for Android/iOS (the file must be present in the app assets)
    // For web, it's more complex, but OneSignal handles default sounds.
    // "ding_ding" sound hint:
    android_sound: 'ding_ding',
    ios_sound: 'ding_ding.wav',
  };

  try {
    const response = await client.createNotification(notification);
    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('OneSignal Error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
