const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../utils/db');

const createCheckoutSession = async (req, res) => {
    const { priceId } = req.body;
    const { landlordId } = req;

    try {
        const landlordRes = await db.query('SELECT email, stripe_customer_id FROM landlords WHERE id = $1', [landlordId]);
        if (landlordRes.rows.length === 0) {
            return res.status(404).json({ error: 'Landlord not found.' });
        }

        let { email, stripe_customer_id } = landlordRes.rows[0];

        if (!stripe_customer_id) {
            const customer = await stripe.customers.create({ email });
            stripe_customer_id = customer.id;
            await db.query('UPDATE landlords SET stripe_customer_id = $1 WHERE id = $2', [stripe_customer_id, landlordId]);
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            customer: stripe_customer_id,
            success_url: `${process.env.FRONTEND_URL}/payment-success`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-canceled`,
            client_reference_id: landlordId, // Pass internal landlordId to Stripe
        });

        return res.status(200).json({ sessionId: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        // Securely construct the event from the raw request body and signature
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                // Retrieve the full session object with expanded product metadata
                const sessionWithProduct = await stripe.checkout.sessions.retrieve(event.data.object.id, {
                    expand: ['line_items.data.price.product'],
                });

                // Extract data from the verified event
                const landlordId = event.data.object.client_reference_id;
                const { planName, usageLimit } = sessionWithProduct.line_items.data[0].price.product.metadata;
                const customerId = event.data.object.customer;
                const subscriptionId = event.data.object.subscription;

                if (!landlordId || !planName || !usageLimit) {
                    console.error('Webhook Error: Missing landlordId, planName, or usageLimit in session metadata.');
                    return res.status(400).send('Webhook Error: Missing metadata.');
                }
                
                // Idempotent database update
                const query = `
                    UPDATE landlords
                    SET
                        subscription_status = 'active',
                        subscription_plan = $1,
                        stripe_customer_id = $2,
                        stripe_subscription_id = $3,
                        usage_limit = $4
                    WHERE
                        id = $5 AND
                        stripe_customer_id IS NULL;
                `;
                await db.query(query, [planName, customerId, subscriptionId, parseInt(usageLimit), landlordId]);
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const { customer, status } = subscription;
                await db.query(
                    'UPDATE landlords SET subscription_status = $1 WHERE stripe_customer_id = $2',
                    [status, customer]
                );
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const { customer } = subscription;
                await db.query(
                    'UPDATE landlords SET subscription_status = $1 WHERE stripe_customer_id = $2',
                    ['canceled', customer]
                );
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error('Error in webhook handler:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    return res.status(200).json({ received: true });
};

const getSubscription = async (req, res) => {
    const { landlordId } = req;
    try {
        const landlordRes = await db.query('SELECT subscription_plan, subscription_status FROM landlords WHERE id = $1', [landlordId]);
        if (landlordRes.rows.length === 0) {
            return res.status(404).json({ error: 'Landlord not found.' });
        }
        const { subscription_plan, subscription_status } = landlordRes.rows[0];
        return res.status(200).json({ plan: subscription_plan, status: subscription_status });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createPortalSession = async (req, res) => {
    const { landlordId } = req;
    try {
        const landlordRes = await db.query('SELECT stripe_customer_id FROM landlords WHERE id = $1', [landlordId]);
        if (landlordRes.rows.length === 0 || !landlordRes.rows[0].stripe_customer_id) {
            return res.status(404).json({ error: 'Stripe customer not found.' });
        }
        const { stripe_customer_id } = landlordRes.rows[0];
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripe_customer_id,
            return_url: `${process.env.FRONTEND_URL}/dashboard`,
        });
        return res.status(200).json({ url: portalSession.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAccountStatus = async (req, res) => {
    const { landlordId } = req;
    try {
        const landlordRes = await db.query('SELECT subscription_status FROM landlords WHERE id = $1', [landlordId]);
        if (landlordRes.rows.length === 0) {
            return res.status(404).json({ error: 'Landlord not found.' });
        }
        const { subscription_status } = landlordRes.rows[0];
        return res.status(200).json({ status: subscription_status });
    } catch (error) {
        console.error('Error fetching account status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    createCheckoutSession,
    stripeWebhook,
    getSubscription,
    createPortalSession,
    getAccountStatus,
};