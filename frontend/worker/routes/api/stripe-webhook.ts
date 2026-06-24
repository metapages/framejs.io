import { define } from "@/utils.ts";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe.ts";
import { graphqlAdmin } from "@/lib/nhost.ts";
import type Stripe from "stripe";

async function updateProfile(
  stripeCustomerId: string,
  updates: Record<string, unknown>,
) {
  await graphqlAdmin(
    `mutation($customerId: String!, $updates: profiles_set_input!) {
      update_profiles(
        where: {stripe_customer_id: {_eq: $customerId}},
        _set: $updates
      ) { affected_rows }
    }`,
    { customerId: stripeCustomerId, updates },
  );
}

export const handler = define.handlers({
  async POST(ctx) {
    const body = await ctx.req.text();
    const signature = ctx.req.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.customer && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          await updateProfile(session.customer as string, {
            subscription_status: sub.status,
            plan: "pro",
            current_period_end: new Date(sub.current_period_end * 1000)
              .toISOString(),
          });
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer && invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            invoice.subscription as string,
          );
          await updateProfile(invoice.customer as string, {
            subscription_status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000)
              .toISOString(),
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer) {
          await updateProfile(invoice.customer as string, {
            subscription_status: "past_due",
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await updateProfile(sub.customer as string, {
          subscription_status: sub.status,
          plan: sub.status === "active" ? "pro" : "free",
          current_period_end: new Date(sub.current_period_end * 1000)
            .toISOString(),
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateProfile(sub.customer as string, {
          subscription_status: "cancelled",
          plan: "free",
          current_period_end: null,
        });
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
