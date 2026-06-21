require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'BrowserStack Bank Payment Server running' });
});

// Create payment sheet — called by the mobile app before showing Stripe UI
app.post('/payment-sheet', async (req, res) => {
  try {
    const { amount = 1099, currency = 'usd', customerName = 'Alex Johnson' } = req.body;

    // Create or retrieve a Stripe customer
    const customer = await stripe.customers.create({
      name: customerName,
      metadata: { source: 'browserstack-bank-app' },
    });

    // Create an ephemeral key for the customer (allows client-side access)
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2024-06-20' }
    );

    // Create the PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,           // amount in smallest currency unit (cents)
      currency,
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      metadata: { integration: 'browserstack-bank-mobile' },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🏦 BrowserStack Bank Payment Server`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   POST /payment-sheet  — create payment intent\n`);
});