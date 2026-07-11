import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MailService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined');
    }

    this.resend = new Resend(apiKey);
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    verificationUrl: string,
  ) {
    const templatePath = join(
      process.cwd(),
      'src',
      'mail',
      'templates',
      'verify-email.hbs',
    );

    const templateFile = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateFile);

    const html = template({
      name,
      verificationUrl,
    });

    await this.resend.emails.send({
      from: this.configService.getOrThrow<string>('MAIL_FROM'),
      to: email,
      subject: 'Verify your email',
      html,
    });
  }
  async forgotPasswordEmail(
    email: string,
    name: string,
    resetPasswordUrl: string,
  ) {
    const templatePath = join(
      process.cwd(),
      'src',
      'mail',
      'templates',
      'forgot-password.hbs',
    );

    const templateFile = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateFile);

    const html = template({
      name,
      resetPasswordUrl,
    });

    await this.resend.emails.send({
      from: this.configService.getOrThrow<string>('MAIL_FROM'),
      to: email,
      subject: 'Verify your email to reset password',
      html,
    });
  }
}
