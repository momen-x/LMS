/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import * as express from 'express';

// import { CreatePaymentDto } from './dto/create-payment.dto';
// import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('checkout/:courseId')
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    // @Body() createPaymentDto: CreatePaymentDto,
    @Param('courseId') courseId: string,
    @AuthenticatedUser()
    user: {
      sub: string;
      role: UserRole;
    },
  ) {
    return this.paymentService.create(user.sub, courseId);
  }
  @ApiExcludeEndpoint()
  @Post('webhook')
  async webhook(@Req() req: express.Request) {
    return this.paymentService.handleWebhook(req);
  }
}
