import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { StudentLocalAuthGuard } from './guards/student-local-auth.guard';
import { StudentLoginDto } from './dto/student-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(StudentLocalAuthGuard)
  @Post('student/login')
  @HttpCode(HttpStatus.OK)
  async loginStudent(
    @Request() req,
    @Body() studentLoginDto: StudentLoginDto,
  ): Promise<{ access_token: string }> {
    return this.authService.loginStudent(req.user);
  }
}
