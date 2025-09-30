import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/user.decorator';
import { StripeService } from './stripe.service';
import { StripeWebhookService } from './stripe-webhook.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import type { JwtPayload } from '../auth/jwt.service';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  constructor(
    private stripeService: StripeService,
    private webhookService: StripeWebhookService,
  ) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiResponse({ status: 201, description: 'Checkout session created successfully' })
  async createCheckoutSession(
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
    @GetUser() user: JwtPayload,
  ) {
    try {
      const session = await this.stripeService.createCheckoutSession({
        ...createCheckoutSessionDto,
        metadata: {
          ...createCheckoutSessionDto.metadata,
          userId: user.sub,
          userEmail: user.email,
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
        sessionData: {
          id: session.id,
          mode: session.mode,
          status: session.status,
          customer: session.customer,
          customerEmail: session.customer_email,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create checkout session: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('customers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create Stripe customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  async createCustomer(
    @Body() createCustomerDto: CreateCustomerDto,
    @GetUser() user: JwtPayload,
  ) {
    try {
      const customer = await this.stripeService.createCustomer({
        ...createCustomerDto,
        metadata: {
          ...createCustomerDto.metadata,
          userId: user.sub,
        },
      });

      return {
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
        created: customer.created,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create customer: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('customers/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get customer details' })
  @ApiParam({ name: 'customerId', description: 'Stripe customer ID' })
  @ApiResponse({ status: 200, description: 'Customer details retrieved' })
  async getCustomer(@Param('customerId') customerId: string) {
    try {
      const customer = await this.stripeService.getCustomer(customerId);

      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      return {
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
        created: customer.created,
        subscriptions: customer.subscriptions?.data || [],
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to retrieve customer: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @GetUser() user: JwtPayload,
  ) {
    try {
      const subscription = await this.stripeService.createSubscription({
        ...createSubscriptionDto,
        metadata: {
          ...createSubscriptionDto.metadata,
          userId: user.sub,
        },
      });

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: subscription.customer,
        currentPeriodStart: (subscription as any).current_period_start,
        currentPeriodEnd: (subscription as any).current_period_end,
        items: subscription.items.data,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create subscription: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('subscriptions/:subscriptionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiParam({ name: 'subscriptionId', description: 'Stripe subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription details retrieved' })
  async getSubscription(@Param('subscriptionId') subscriptionId: string) {
    try {
      const subscription = await this.stripeService.getSubscription(subscriptionId);

      if (!subscription) {
        throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
      }

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: subscription.customer,
        currentPeriodStart: (subscription as any).current_period_start,
        currentPeriodEnd: (subscription as any).current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        items: subscription.items.data,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to retrieve subscription: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('subscriptions/:subscriptionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiParam({ name: 'subscriptionId', description: 'Stripe subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  async updateSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    try {
      const subscription = await this.stripeService.updateSubscription(
        subscriptionId,
        updateSubscriptionDto,
      );

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: (subscription as any).current_period_start,
        currentPeriodEnd: (subscription as any).current_period_end,
        items: subscription.items.data,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update subscription: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('subscriptions/:subscriptionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiParam({ name: 'subscriptionId', description: 'Stripe subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancelSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body() cancelSubscriptionDto: CancelSubscriptionDto,
  ) {
    try {
      const subscription = await this.stripeService.cancelSubscription(
        subscriptionId,
        cancelSubscriptionDto.immediately,
      );

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        canceledAt: subscription.canceled_at,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to cancel subscription: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('customers/:customerId/subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get customer subscriptions' })
  @ApiParam({ name: 'customerId', description: 'Stripe customer ID' })
  @ApiResponse({ status: 200, description: 'Customer subscriptions retrieved' })
  async getCustomerSubscriptions(@Param('customerId') customerId: string) {
    try {
      const subscriptions = await this.stripeService.getCustomerSubscriptions(customerId);

      return {
        customerId,
        subscriptions: subscriptions.map(sub => ({
          subscriptionId: sub.id,
          status: sub.status,
          currentPeriodStart: (sub as any).current_period_start,
          currentPeriodEnd: (sub as any).current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          items: sub.items.data,
        })),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve customer subscriptions: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('customers/:customerId/invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get customer invoices' })
  @ApiParam({ name: 'customerId', description: 'Stripe customer ID' })
  @ApiResponse({ status: 200, description: 'Customer invoices retrieved' })
  async getCustomerInvoices(@Param('customerId') customerId: string) {
    try {
      const invoices = await this.stripeService.getInvoices(customerId);

      return {
        customerId,
        invoices: invoices.map(invoice => ({
          invoiceId: invoice.id,
          status: invoice.status,
          amountDue: invoice.amount_due,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          created: invoice.created,
          dueDate: invoice.due_date,
          invoicePdf: invoice.invoice_pdf,
        })),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve customer invoices: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      if (!signature) {
        throw new HttpException('Missing Stripe signature', HttpStatus.BAD_REQUEST);
      }

      const event = await this.stripeService.constructEventFromPayload(
        request.rawBody || request.body,
        signature,
      );

      await this.webhookService.handleWebhookEvent(event);

      return { received: true };
    } catch (error) {
      throw new HttpException(
        `Webhook error: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}