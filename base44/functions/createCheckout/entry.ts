const PRICE_MAP = {
  scandinavia: "price_1ToME6AXrjnabHkaTkGvUnlP",
  switzerland: "price_1ToME6AXrjnabHkagcmo2OGg",
  western_eu: "price_1ToME6AXrjnabHkaOWTibFLu",
  central_eu: "price_1ToME6AXrjnabHkatUrUNnYE",
  turkey: "price_1ToME6AXrjnabHkakykBnCOT",
  albania_kosovo: "price_1ToME6AXrjnabHkalev3oFdS",
  balkan: "price_1ToME6AXrjnabHkaNJxzmkZq",
};

Deno.serve(async (req) => {
  try {
    const { plan } = await req.json();
    const priceId = PRICE_MAP[plan];
    if (!priceId) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "https://getwhisper.pro";
    const secretKey = Deno.env.get("STRIPE_SECRET_KEY");

    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    params.append("subscription_data[trial_period_days]", "14");
    params.append("success_url", `${origin}/?payment=success`);
    params.append("cancel_url", `${origin}/?payment=cancelled`);
    params.append("metadata[base44_app_id]", Deno.env.get("BASE44_APP_ID") || "");

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("createCheckout: Stripe error:", data);
      return Response.json({ error: data.error?.message || "Stripe error" }, { status: 500 });
    }

    return Response.json({ url: data.url });
  } catch (error) {
    console.error("createCheckout error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});