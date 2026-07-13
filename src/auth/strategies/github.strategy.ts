import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AuthProvider } from '@prisma/client';
import { Profile, Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';
import { ProviderUserProfile } from '../types/provider-profile.type';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'], // ← correct GitHub scope
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: Express.User | false) => void,
  ): Promise<void> {
    try {
      const email = profile.emails?.[0]?.value;
      const avatar = profile.photos?.[0]?.value ?? null;

      if (!email) {
        throw new UnauthorizedException(
          'GitHub account did not provide an email address',
        );
      }

      const githubProfile: ProviderUserProfile = {
        providerId: profile.id,
        email: email.trim().toLowerCase(),
        name: profile.displayName || email.split('@')[0],
        avatar,
        provider: AuthProvider.github,
      };

      const user = await this.authService.validateGithubUser(githubProfile);
      done(null, user);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
}
