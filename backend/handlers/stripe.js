const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getClient } = require('../db');

const createCheckoutSession = async (req, res) => {
    const { priceId } = req.body;
    const { landlordId } = req;

    const client = await getClient();
    try {
        const landlordRes = await client.query('SELECT email, stripe_customer_id FROM landlords WHERE id = $1', [landlordId]);
        if (landlordRes.rows.length === 0) {
            return res.status(404).json({ error: 'Landlord not found.' });
        }

        let { email, stripe_customer_id } = landlordRes.rows[0];

        if (!stripe_customer_id) {
            const customer = await stripe.customers.create({ email });
            stripe_customer_id = customer.id;
            await client.query('UPDATE landlords SET stripe_customer_id = $1 WHERE id = $2', [stripe_customer_id, landlordId]);
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            customer: stripe_customer_id,
            success_url: `${process.env.PORTAL_HOST}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.PORTAL_HOST}/pricing`,
        });

        return res.status(200).json({ sessionId: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (client) {
            await client.end();
        }
    }
};

const PRICE_ID_TO_PLAN = {
    'price_1S01GcDle4cCh3dRWBh0E0Mi': 'starter',
    'price_1S01H7Dle4cCh3dRr9Lm4crU': 'pro',
    'price_1S01HQDle4cCh3dRvyf26eGq': 'business',
};

const stripeWebhook = async (req, res) => {
    let stripeEvent;

    if (process.env.IS_OFFLINE) {
        stripeEvent = req.body;
    } else {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        try {
            stripeEvent = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`, err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }

    const client = await getClient();
    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                const session = await stripe.checkout.sessions.retrieve(stripeEvent.data.object.id, {
                    expand: ['line_items'],
                });
                const { customer, subscription } = session;
                const priceId = session.line_items.data[0].price.id;
                const plan = PRICE_ID_TO_PLAN[priceId];

                if (plan) {
                    await client.query(
                        'UPDATE landlords SET stripe_subscription_id = $1, subscription_status = $2, subscription_plan = $3 WHERE stripe_customer_id = $4',
                        [subscription, 'active', plan, customer]
                    );
                } else {
                     await client.query(
                        'UPDATE landlords SET stripe_subscription_id = $1, subscription_status = $2 WHERE stripe_customer_id = $3',
                        [subscription, 'active', customer]
                    );
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = stripeEvent.data.object;
                const { customer, status } = subscription;
                await client.query(
                    'UPDATE landlords SET subscription_status = $1 WHERE stripe_customer_id = $2',
                    [status, customer]
                );
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = stripeEvent.data.object;
                const { customer } = subscription;
                await client.query(
                    'UPDATE landlords SET subscription_status = $1 WHERE stripe_customer_id = $2',
                    ['canceled', customer]
                );
                break;
            }
            default:
                console.log(`Unhandled event type ${stripeEvent.type}`);
        }
    } catch (error) {
        console.error('Error in webhook handler:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (client) {
            await client.end();
        }
    }

    return res.status(200).json({ received: true });
};

const getSubscription = async (req, res) => {
    const { landlordId } = req;
    const client = await getClient();
    try {
        const landlordRes = await client.query('SELECT subscription_plan, subscription_status FROM landlords WHERE id = $1', [landlordId]);
        if (landlordRes.rows.length === 0) {
            return res.status(404).json({ error: 'Landlord not found.' });
        }
        const { subscription_plan, subscription_status } = landlordRes.rows[0];
        return res.status(200).json({ plan: subscription_plan, status: subscription_status });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (client) {
            await client.end();
        }
    }
};

const createPortalSession = async (req, res) => {
    const { landlordId } = req;
    const client = await getClient();
    try {
        const landlordRes = await client.query('SELECT stripe_customer_id FROM landlords WHERE id = $1', [landlordId]);
        if (landlordRes.rows.length === 0 || !landlordRes.rows[0].stripe_customer_id) {
            return res.status(404).json({ error: 'Stripe customer not found.' });
        }
        const { stripe_customer_id } = landlordRes.rows[0];
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripe_customer_id,
            return_url: `${process.env.PORTAL_HOST}/dashboard`,
        });
        return res.status(200).json({ url: portalSession.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (client) {
            await client.end();
        }
    }
};

module.exports = {
    createCheckoutSession,
    stripeWebhook,
    getSubscription,
    createPortalSession,
};