import { IsString, IsOptional, IsEnum, IsEmail, IsObject, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LineItemDto {
  @ApiProperty({ description: 'Price ID for the line item' })
  @IsString()
  priceId: string;

  @ApiProperty({ description: 'Quantity of the item', default: 1 })
  @IsNumber()
  quantity: number;
}

export class CreateCheckoutSessionDto {
  @ApiPropertyOptional({ description: 'Stripe Price ID (for single item)' })
  @IsOptional()
  @IsString()
  priceId?: string;

  @ApiProperty({ description: 'Success URL after payment completion' })
  @IsString()
  successUrl: string;

  @ApiProperty({ description: 'Cancel URL if payment is cancelled' })
  @IsString()
  cancelUrl: string;

  @ApiPropertyOptional({ description: 'Customer ID if existing customer' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Customer email for new customers' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Checkout mode',
    enum: ['payment', 'subscription', 'setup'],
    default: 'payment'
  })
  @IsOptional()
  @IsEnum(['payment', 'subscription', 'setup'])
  mode?: 'payment' | 'subscription' | 'setup';

  @ApiPropertyOptional({
    description: 'Line items for multiple items',
    type: [LineItemDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems?: LineItemDto[];
}