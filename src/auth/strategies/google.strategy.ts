import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AuthProvider } from '@prisma/client';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { ProviderUserProfile } from '../types/provider-profile.type';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),

      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),

      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),

      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const email = profile.emails?.find((entry) => entry.verified)?.value;
      const avatar = profile.photos?.[0]?.value ?? null;

      if (!email) {
        throw new UnauthorizedException(
          'Google account did not provide an email address',
        );
      }

      const googleProfile: ProviderUserProfile = {
        providerId: profile.id,
        email: email.trim().toLowerCase(),
        emailVerified: true,
        name: profile.displayName || email.split('@')[0],
        avatar,
        provider: AuthProvider.google,
      };

      const user = await this.authService.validateGoogleUser(googleProfile);

      done(null, user);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
}
