import { define } from "@/utils.ts";
import { stripe, STRIPE_PRICE_ID } from "@/lib/stripe.ts";
import { graphqlAdmin } from "@/lib/nhost.ts";

export const handler = define.handlers({
  async POST(ctx) {
    if (!ctx.state.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = ctx.state.user.id;
    const email = ctx.state.user.email;

    // Get or create Stripe customer
    const profileData = await graphqlAdmin<{
      profiles: Array<{ stripe_customer_id: string | null }>;
    }>(
      `query($userId: uuid!) {
        profiles(where: {user_id: {_eq: $userId}}) {
          stripe_customer_id
        }
      }`,
      { userId },
    );

    let customerId = profileData.profiles[0]?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { nhost_user_id: userId },
      });
      customerId = customer.id;

      // Upsert profile with Stripe customer ID
      await graphqlAdmin(
        `mutation($userId: uuid!, $customerId: String!) {
          insert_profiles_one(
            object: {user_id: $userId, stripe_customer_id: $customerId},
            on_conflict: {constraint: profiles_user_id_key, update_columns: [stripe_customer_id]}
          ) { id }
        }`,
        { userId, customerId },
      );
    }

    const origin = new URL(ctx.req.url).origin;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      metadata: { nhost_user_id: userId },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
