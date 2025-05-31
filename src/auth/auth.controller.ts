import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ConflictException,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { StudentLocalAuthGuard } from './guards/student-local-auth.guard';
import { AdminLocalAuthGuard } from './guards/admin-local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { StudentLoginDto } from './dto/student-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { AuthenticatedUser, JwtPayload } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerStudent(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<{ access_token: string }> {
    try {
      return await this.authService.registerStudent(createStudentDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @UseGuards(StudentLocalAuthGuard)
  @Post('student/login')
  @HttpCode(HttpStatus.OK)
  async loginStudent(
    @Request() req,
    @Body() studentLoginDto: StudentLoginDto,
  ): Promise<{ access_token: string }> {
    return this.authService.loginStudent(req.user);
  }

  @UseGuards(AdminLocalAuthGuard)
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async loginAdmin(
    @Request() req,
    @Body() adminLoginDto: AdminLoginDto,
  ): Promise<{ access_token: string }> {
    return this.authService.loginAdmin(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<{ message: string }> {
    return this.authService.logoutUser(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: AuthenticatedUser }) {
    return {
      message: 'This is a protected profile route.',
      user: req.user,
    };
  }
}
