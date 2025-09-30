import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { AppConfig } from '../config/configuration';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private configService: ConfigService<AppConfig>) {
    const stripeConfig = this.configService.get('stripe', { infer: true });

    if (!stripeConfig?.secretKey) {
      throw new Error('Stripe secret key must be configured');
    }

    this.stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  async createCheckoutSession(params: {
    priceId?: string;
    successUrl: string;
    cancelUrl: string;
    customerId?: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
    mode?: 'payment' | 'subscription' | 'setup';
    lineItems?: Stripe.Checkout.SessionCreateParams.LineItem[];
  }): Promise<Stripe.Checkout.Session> {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: params.mode || 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    };

    if (params.customerId) {
      sessionParams.customer = params.customerId;
    } else if (params.customerEmail) {
      sessionParams.customer_email = params.customerEmail;
    }

    if (params.lineItems) {
      sessionParams.line_items = params.lineItems;
    } else if (params.priceId) {
      sessionParams.line_items = [
        {
          price: params.priceId,
          quantity: 1,
        },
      ];
    }

    if (params.mode === 'subscription') {
      sessionParams.subscription_data = {
        metadata: params.metadata,
      };
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    this.logger.log(`Created checkout session: ${session.id}`);
    return session;
  }

  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });

    this.logger.log(`Created customer: ${customer.id} for ${params.email}`);
    return customer;
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      this.logger.error(`Failed to retrieve customer ${customerId}:`, error);
      return null;
    }
  }

  async createSubscription(params: {
    customerId: string;
    priceId: string;
    metadata?: Record<string, string>;
    trialPeriodDays?: number;
  }): Promise<Stripe.Subscription> {
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: params.metadata,
    };

    if (params.trialPeriodDays) {
      subscriptionParams.trial_period_days = params.trialPeriodDays;
    }

    const subscription = await this.stripe.subscriptions.create(subscriptionParams);

    this.logger.log(`Created subscription: ${subscription.id} for customer: ${params.customerId}`);
    return subscription;
  }

  async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    if (immediately) {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      this.logger.log(`Immediately cancelled subscription: ${subscriptionId}`);
      return subscription;
    } else {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      this.logger.log(`Scheduled cancellation for subscription: ${subscriptionId}`);
      return subscription;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to retrieve subscription ${subscriptionId}:`, error);
      return null;
    }
  }

  async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        limit: 100,
      });
      return subscriptions.data;
    } catch (error) {
      this.logger.error(`Failed to retrieve subscriptions for customer ${customerId}:`, error);
      return [];
    }
  }

  async updateSubscription(
    subscriptionId: string,
    params: {
      priceId?: string;
      metadata?: Record<string, string>;
      prorationBehavior?: 'always_invoice' | 'create_prorations' | 'none';
    }
  ): Promise<Stripe.Subscription> {
    const updateParams: Stripe.SubscriptionUpdateParams = {
      metadata: params.metadata,
      proration_behavior: params.prorationBehavior || 'create_prorations',
    };

    if (params.priceId) {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      updateParams.items = [
        {
          id: subscription.items.data[0].id,
          price: params.priceId,
        },
      ];
    }

    const subscription = await this.stripe.subscriptions.update(subscriptionId, updateParams);

    this.logger.log(`Updated subscription: ${subscriptionId}`);
    return subscription;
  }

  async createPrice(params: {
    productId: string;
    unitAmount: number;
    currency: string;
    recurring?: {
      interval: 'day' | 'week' | 'month' | 'year';
      intervalCount?: number;
    };
    metadata?: Record<string, string>;
  }): Promise<Stripe.Price> {
    const priceParams: Stripe.PriceCreateParams = {
      product: params.productId,
      unit_amount: params.unitAmount,
      currency: params.currency,
      metadata: params.metadata,
    };

    if (params.recurring) {
      priceParams.recurring = params.recurring;
    }

    const price = await this.stripe.prices.create(priceParams);

    this.logger.log(`Created price: ${price.id} for product: ${params.productId}`);
    return price;
  }

  async createProduct(params: {
    name: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Product> {
    const product = await this.stripe.products.create({
      name: params.name,
      description: params.description,
      metadata: params.metadata,
    });

    this.logger.log(`Created product: ${product.id}`);
    return product;
  }

  async constructEventFromPayload(
    payload: string | Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    const stripeConfig = this.configService.get('stripe', { infer: true });

    if (!stripeConfig?.webhookSecret) {
      throw new Error('Stripe webhook secret must be configured');
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeConfig.webhookSecret,
    );
  }

  async getInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: 100,
      });
      return invoices.data;
    } catch (error) {
      this.logger.error(`Failed to retrieve invoices for customer ${customerId}:`, error);
      return [];
    }
  }

  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      this.logger.error(`Failed to retrieve payment methods for customer ${customerId}:`, error);
      return [];
    }
  }
}