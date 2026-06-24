import Stripe from "stripe";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-02-24.acacia",
});

export const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ??
  "";
export const STRIPE_PRICE_ID = Deno.env.get("STRIPE_PRICE_ID") ?? "";
