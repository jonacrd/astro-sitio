// Server-side WhatsApp client utilities
// NOTE: Do not import this from client code

type TemplateComponentParam = { type: 'text' | 'currency' | 'date_time' | 'url'; text?: string };

export interface SendTemplateParams {
  to: string; // E.164 without plus
  template: string;
  components?: TemplateComponentParam[];
}

async function logResult(entry: {
  to_phone: string;
  template: string;
  payload: any;
  response_status: number;
  response_body: any;
}) {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    if (!supabaseUrl || !serviceKey) return;
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(supabaseUrl, serviceKey);
    await sb.from('whatsapp_logs').insert({
      to_phone: entry.to_phone,
      template: entry.template,
      payload: entry.payload,
      response_status: entry.response_status,
      response_body: entry.response_body
    });
  } catch {}
}

export async function sendTemplateMessage({ to, template, components = [] }: SendTemplateParams) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  const languageCode = template === 'hello_world' ? 'en_US' : 'es';

  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: template,
      language: { code: languageCode },
      components: components.length
        ? [{ type: 'body', parameters: components }]
        : undefined
    }
  };

  let resStatus = 0;
  let resBody: any = null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    resStatus = res.status;
    resBody = await res.json().catch(() => ({}));
    await logResult({ to_phone: to, template, payload: body, response_status: resStatus, response_body: resBody });

    if (res.ok) return { ok: true, result: resBody };

    // soft retry once
    const retry = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    resStatus = retry.status;
    resBody = await retry.json().catch(() => ({}));
    await logResult({ to_phone: to, template, payload: { ...body, retry: true }, response_status: resStatus, response_body: resBody });
    return { ok: retry.ok, result: resBody };
  } catch (error: any) {
    await logResult({ to_phone: to, template, payload: body, response_status: 0, response_body: { error: error?.message || 'unknown' } });
    return { ok: false, error: error?.message };
  }
}

// Helpers
export async function notifyOrderCreatedToSeller({ sellerPhone, orderId, confirmUrl }: { sellerPhone: string; orderId: string; confirmUrl: string; }) {
  return sendTemplateMessage({
    to: sellerPhone,
    template: 'order_created',
    components: [
      { type: 'text', text: orderId.substring(0, 8) },
      { type: 'text', text: confirmUrl }
    ]
  });
}

export async function notifyOrderConfirmedToBuyer({ buyerPhone, orderId, trackingUrl }: { buyerPhone: string; orderId: string; trackingUrl: string; }) {
  return sendTemplateMessage({
    to: buyerPhone,
    template: 'order_confirmed',
    components: [
      { type: 'text', text: orderId.substring(0, 8) },
      { type: 'text', text: trackingUrl }
    ]
  });
}

export async function notifyOrderOnTheWay({ buyerPhone, orderId, trackingUrl }: { buyerPhone: string; orderId: string; trackingUrl: string; }) {
  return sendTemplateMessage({
    to: buyerPhone,
    template: 'order_on_the_way',
    components: [
      { type: 'text', text: orderId.substring(0, 8) },
      { type: 'text', text: trackingUrl }
    ]
  });
}

export async function notifyOrderDelivered({ buyerPhone, orderId, rateUrl, pointsUrl }: { buyerPhone: string; orderId: string; rateUrl: string; pointsUrl: string; }) {
  return sendTemplateMessage({
    to: buyerPhone,
    template: 'order_delivered',
    components: [
      { type: 'text', text: orderId.substring(0, 8) },
      { type: 'text', text: rateUrl },
      { type: 'text', text: pointsUrl }
    ]
  });
}
