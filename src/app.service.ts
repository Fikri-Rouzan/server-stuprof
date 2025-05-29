import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    const dbUrl = this.configService.get<string>('MONGODB_URL');
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    console.log('MongoDB URL from .env:', dbUrl);
    console.log('JWT Secret from .env:', jwtSecret);

    return 'Hello World with Config!';
  }
}
