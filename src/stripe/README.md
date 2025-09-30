# Stripe Integration

This module provides comprehensive Stripe integration for payment processing, subscription management, and webhook handling.

## Features

- **Checkout Sessions**: Create payment and subscription checkout sessions
- **Customer Management**: Create and manage Stripe customers
- **Subscription Management**: Full subscription lifecycle management
- **Webhook Handling**: Process Stripe webhook events
- **Invoice Management**: Retrieve customer invoices and payment history
- **Payment Methods**: Manage customer payment methods

## Environment Variables

Add these environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## API Endpoints

### Checkout Sessions

#### Create Checkout Session
- **POST** `/stripe/checkout-session`
- **Auth**: Required (Bearer token)
- **Description**: Create a Stripe checkout session for payment or subscription

**Request Body:**
```json
{
  "priceId": "price_1234567890",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel",
  "mode": "payment", // or "subscription"
  "customerEmail": "customer@example.com",
  "metadata": {
    "orderId": "order_123"
  }
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_...",
  "sessionData": {
    "id": "cs_test_...",
    "mode": "payment",
    "status": "open",
    "customer": null,
    "customerEmail": "customer@example.com"
  }
}
```

### Customer Management

#### Create Customer
- **POST** `/stripe/customers`
- **Auth**: Required (Bearer token)

**Request Body:**
```json
{
  "email": "customer@example.com",
  "name": "John Doe",
  "metadata": {
    "userId": "user_123"
  }
}
```

#### Get Customer
- **GET** `/stripe/customers/:customerId`
- **Auth**: Required (Bearer token)

### Subscription Management

#### Create Subscription
- **POST** `/stripe/subscriptions`
- **Auth**: Required (Bearer token)

**Request Body:**
```json
{
  "customerId": "cus_...",
  "priceId": "price_...",
  "trialPeriodDays": 7,
  "metadata": {
    "planType": "premium"
  }
}
```

#### Get Subscription
- **GET** `/stripe/subscriptions/:subscriptionId`
- **Auth**: Required (Bearer token)

#### Update Subscription
- **PUT** `/stripe/subscriptions/:subscriptionId`
- **Auth**: Required (Bearer token)

**Request Body:**
```json
{
  "priceId": "price_new_plan",
  "prorationBehavior": "create_prorations"
}
```

#### Cancel Subscription
- **DELETE** `/stripe/subscriptions/:subscriptionId`
- **Auth**: Required (Bearer token)

**Request Body:**
```json
{
  "immediately": false // Cancel at period end if false
}
```

#### Get Customer Subscriptions
- **GET** `/stripe/customers/:customerId/subscriptions`
- **Auth**: Required (Bearer token)

### Invoice Management

#### Get Customer Invoices
- **GET** `/stripe/customers/:customerId/invoices`
- **Auth**: Required (Bearer token)

### Webhook Handling

#### Stripe Webhook Endpoint
- **POST** `/stripe/webhooks`
- **Auth**: None (validated via Stripe signature)
- **Description**: Handles Stripe webhook events

**Supported Events:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.created`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

## Usage Examples

### Frontend Integration (JavaScript)

```javascript
// Create checkout session
const createCheckoutSession = async (priceId) => {
  const response = await fetch('/stripe/checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      priceId: priceId,
      successUrl: `${window.location.origin}/success`,
      cancelUrl: `${window.location.origin}/cancel`,
      mode: 'subscription'
    })
  });

  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe Checkout
};

// Get customer subscriptions
const getSubscriptions = async (customerId) => {
  const response = await fetch(`/stripe/customers/${customerId}/subscriptions`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const { subscriptions } = await response.json();
  return subscriptions;
};
```

### Backend Service Usage

```typescript
import { Injectable } from '@nestjs/common';
import { StripeService } from './stripe/stripe.service';

@Injectable()
export class PaymentService {
  constructor(private stripeService: StripeService) {}

  async createCustomerAndSubscription(userEmail: string, priceId: string) {
    // Create customer
    const customer = await this.stripeService.createCustomer({
      email: userEmail,
      metadata: { source: 'app_signup' }
    });

    // Create subscription
    const subscription = await this.stripeService.createSubscription({
      customerId: customer.id,
      priceId: priceId,
      trialPeriodDays: 14
    });

    return { customer, subscription };
  }

  async handleUpgrade(subscriptionId: string, newPriceId: string) {
    return this.stripeService.updateSubscription(subscriptionId, {
      priceId: newPriceId,
      prorationBehavior: 'create_prorations'
    });
  }
}
```

## Webhook Event Handling

The webhook service processes Stripe events and provides hooks for your business logic. Customize the handlers in `stripe-webhook.service.ts`:

```typescript
private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  // Your business logic here
  if (session.mode === 'subscription') {
    // Handle subscription activation
    const userId = session.metadata?.userId;
    // Update user subscription status in database
  }
}

private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  // Handle successful payment
  const customerId = invoice.customer as string;
  // Send receipt email, extend subscription, etc.
}
```

## Testing

### Test Mode
Use Stripe test keys for development:
- Secret Key: `sk_test_...`
- Publishable Key: `pk_test_...`

### Test Cards
```
4242424242424242 - Visa (succeeds)
4000000000000002 - Visa (declined)
4000000000000069 - Visa (expired)
```

### Webhook Testing
Use Stripe CLI to forward webhooks to your local development server:

```bash
stripe listen --forward-to localhost:3000/stripe/webhooks
```

This will provide you with a webhook signing secret for development.

## Security Considerations

1. **Environment Variables**: Never commit Stripe keys to version control
2. **Webhook Signatures**: Always validate webhook signatures
3. **HTTPS**: Use HTTPS in production for webhook endpoints
4. **Key Rotation**: Regularly rotate your Stripe keys
5. **Metadata**: Don't store sensitive data in Stripe metadata

## Error Handling

The module includes comprehensive error handling:
- Invalid API calls return appropriate HTTP status codes
- Webhook signature validation failures are logged and rejected
- Stripe API errors are caught and returned as HTTP exceptions

## Monitoring and Logging

All Stripe operations are logged with relevant details:
- Customer creation/updates
- Subscription changes
- Payment processing
- Webhook event processing

Monitor these logs for debugging and audit purposes.

## Production Checklist

- [ ] Replace test keys with live Stripe keys
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Set up proper error monitoring
- [ ] Implement database storage for subscription data
- [ ] Set up email notifications for payment events
- [ ] Configure proper CORS settings
- [ ] Set up rate limiting for webhook endpoints