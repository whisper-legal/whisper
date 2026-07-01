import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function verifyStripeSignature(body, signatureHeader, secret) {
  const parts = signatureHeader.split(",");
  const timestampPart = parts.find(p => p.startsWith("t="));
  const signaturePart = parts.find(p => p.startsWith("v1="));
  if (!timestampPart || !signaturePart) return null;

  const timestamp = timestampPart.split("=")[1];
  const signature = signaturePart.split("=")[1];

  const payload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hexSignature = Array.from(new Uint8Array(signed))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  if (hexSignature === signature) {
    return parseInt(timestamp);
  }
  return null;
}

async function getCustomerEmail(customerId) {
  if (!customerId) return null;
  const response = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
    headers: { "Authorization": `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")}` },
  });
  const data = await response.json();
  return data.email || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      console.error("stripeWebhook: Missing signature or webhook secret");
      return Response.json({ error: "Missing signature or secret" }, { status: 400 });
    }

    const timestamp = await verifyStripeSignature(body, signature, webhookSecret);
    if (!timestamp) {
      console.error("stripeWebhook: Invalid signature");
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    async function upsertSubscription(email, updates) {
      if (!email) return;
      const emailLower = email.toLowerCase();
      const existing = await base44.asServiceRole.entities.Subscription.filter({ email: emailLower });
      if (existing && existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, updates);
      } else {
        await base44.asServiceRole.entities.Subscription.create({ email: emailLower, ...updates });
      }
    }

    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const email = invoice.customer_email || await getCustomerEmail(invoice.customer);
        console.log("stripeWebhook: payment_succeeded for", email);
        await upsertSubscription(email, {
          status: "active",
          stripe_subscription_id: invoice.subscription,
          stripe_customer_id: invoice.customer,
        });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const email = invoice.customer_email || await getCustomerEmail(invoice.customer);
        console.log("stripeWebhook: payment_failed for", email);
        await upsertSubscription(email, {
          status: "past_due",
          stripe_subscription_id: invoice.subscription,
          stripe_customer_id: invoice.customer,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const email = await getCustomerEmail(sub.customer);
        console.log("stripeWebhook: subscription_deleted for", email);
        await upsertSubscription(email, {
          status: "canceled",
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer,
        });
        break;
      }
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object;
        const email = await getCustomerEmail(sub.customer);
        console.log("stripeWebhook: trial_will_end for", email);
        if (email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: "Whisper Premium — Your free trial ends soon",
            body: "Your 14-day free trial of Whisper Premium ends in 3 days. Your subscription will continue automatically — no action needed.\n\nIf you wish to cancel, visit your account settings.\n\nThank you for using Whisper!",
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("stripeWebhook error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});