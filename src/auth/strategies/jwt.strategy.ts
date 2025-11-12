import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

export interface AuthenticatedUser {
  userId: string;
  role: 'student' | 'admin';
  username?: string;
  nim?: string;
  name?: string;
}

export interface JwtPayload {
  sub: string;
  role: 'student' | 'admin';
  username?: string;
  nim?: string;
  name?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.authService.validateUserFromJwt(payload);

    if (!user) {
      throw new UnauthorizedException('User from token not found or invalid.');
    }

    return user;
  }
}
