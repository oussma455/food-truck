import * as OneSignal from 'onesignal-node';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const API_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!APP_ID || !API_KEY) {
    return NextResponse.json(
      { error: 'OneSignal credentials are not configured' },
      { status: 500 }
    );
  }

  const client = new OneSignal.Client(APP_ID, API_KEY);
  const { type, clientName, orderId } = await req.json();

  let notification = {};

  if (type === 'TRUCK_OPEN') {
    notification = {
      contents: {
        en: 'The Gourmet Truck is now OPEN! 🔔 Come and grab your delicious sandwich!',
        fr: 'Le Gourmet Truck est maintenant OUVERT ! 🔔 C\'est l\'heure de commander votre sandwich !',
      },
      headings: {
        en: 'Gourmet Truck Open!',
        fr: 'Gourmet Truck Ouvert !',
      },
      included_segments: ['All'],
      android_sound: 'ding_ding',
      ios_sound: 'ding_ding.wav',
    };
  } else if (type === 'ORDER_READY') {
    notification = {
      contents: {
        en: `Hey ${clientName}, your order ${orderId} is READY! 🌯 Come and get it while it's hot!`,
        fr: `Hey ${clientName}, votre commande ${orderId} est PRÊTE ! 🌯 Venez la récupérer pendant qu'elle est chaude !`,
      },
      headings: {
        en: 'Order Ready!',
        fr: 'Commande Prête !',
      },
      // In a real app, we would target a specific player_id or external_user_id
      // For now, we send to all as a demonstration or if using segments
      included_segments: ['Subscribed Users'],
      android_sound: 'order_ready',
      ios_sound: 'order_ready.wav',
    };
  }

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
