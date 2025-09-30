import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.created':
          await this.handleCustomerCreated(event.data.object as Stripe.Customer);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          this.logger.warn(`Unhandled webhook event type: ${event.type}`);
          break;
      }
    } catch (error) {
      this.logger.error(`Error processing webhook event ${event.type}:`, error);
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    this.logger.log(`Checkout session completed: ${session.id}`);

    // TODO: Implement your business logic here
    // Examples:
    // - Update user subscription status in database
    // - Send confirmation email
    // - Grant access to paid features
    // - Create order record

    if (session.mode === 'subscription') {
      this.logger.log(`Subscription checkout completed for customer: ${session.customer}`);
      // Handle subscription setup
    } else if (session.mode === 'payment') {
      this.logger.log(`One-time payment completed for customer: ${session.customer}`);
      // Handle one-time payment
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription created: ${subscription.id} for customer: ${subscription.customer}`);

    // TODO: Implement your business logic here
    // Examples:
    // - Create subscription record in database
    // - Send welcome email
    // - Grant access to subscription features
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription updated: ${subscription.id}`);

    // TODO: Implement your business logic here
    // Examples:
    // - Update subscription details in database
    // - Handle plan changes
    // - Update access permissions
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription deleted: ${subscription.id}`);

    // TODO: Implement your business logic here
    // Examples:
    // - Update subscription status in database
    // - Revoke access to subscription features
    // - Send cancellation confirmation email
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Invoice payment succeeded: ${invoice.id} for customer: ${invoice.customer}`);

    // TODO: Implement your business logic here
    // Examples:
    // - Update payment status in database
    // - Send receipt email
    // - Extend subscription period
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Invoice payment failed: ${invoice.id} for customer: ${invoice.customer}`);

    // TODO: Implement your business logic here
    // Examples:
    // - Update payment status in database
    // - Send payment failure notification
    // - Implement dunning management
  }

  private async handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
    this.logger.log(`Customer created: ${customer.id} with email: ${customer.email}`);

    // TODO: Implement your business logic here
    // Examples:
    // - Create or update customer record in database
    // - Send welcome email
    // - Set up customer preferences
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);

    // TODO: Implement your business logic here
    // Examples:
    // - Update order status
    // - Send confirmation email
    // - Fulfill digital products
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment intent failed: ${paymentIntent.id}`);

    // TODO: Implement your business logic here
    // Examples:
    // - Update payment status
    // - Send payment failure notification
    // - Retry payment logic
  }
}