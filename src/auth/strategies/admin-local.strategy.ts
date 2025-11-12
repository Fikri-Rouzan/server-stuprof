import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Admin } from '@prisma/client';

@Injectable()
export class AdminLocalStrategy extends PassportStrategy(
  Strategy,
  'admin-local',
) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(
    username: string,
    pass: string,
  ): Promise<Omit<Admin, 'password'>> {
    const admin = await this.authService.validateAdminByCredentials(
      username,
      pass,
    );

    if (!admin) {
      throw new UnauthorizedException('Invalid username or password for admin');
    }

    return admin;
  }
}
