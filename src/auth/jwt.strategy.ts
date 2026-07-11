import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JWTPayloadType } from 'src/utils/type';
import { ACCESS_TOKEN_COOKIE } from './auth-cookie.options';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret)
      throw new Error('JWT_ACCESS_SECRET is not defined in environment');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          if (!req) return null;
          const cookieToken = (req.cookies as
            Record<string, string> | undefined)
            ? (req.cookies[ACCESS_TOKEN_COOKIE] as string | undefined)
            : undefined;
          if (cookieToken) return cookieToken;

          const authHeaderToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
          if (authHeaderToken) return authHeaderToken;

          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JWTPayloadType) {
    const user = await this.prisma.user.findUnique({
      where: { id: String(payload.sub) },
      select: { id: true, email: true, role: true, provider: true },
    });

    if (!user) throw new UnauthorizedException('User no longer exists');
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      provider: user.provider,
    };
  }
}
