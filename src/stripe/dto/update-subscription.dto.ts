import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'New price ID for the subscription' })
  @IsOptional()
  @IsString()
  priceId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Proration behavior',
    enum: ['always_invoice', 'create_prorations', 'none'],
    default: 'create_prorations'
  })
  @IsOptional()
  @IsEnum(['always_invoice', 'create_prorations', 'none'])
  prorationBehavior?: 'always_invoice' | 'create_prorations' | 'none';
}