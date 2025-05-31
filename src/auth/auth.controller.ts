import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { StudentLocalAuthGuard } from './guards/student-local-auth.guard';
import { AdminLocalAuthGuard } from './guards/admin-local-auth.guard';
import { StudentLoginDto } from './dto/student-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Get } from '@nestjs/common';

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
  @Get('profile')
  getProfile(@Request() req) {
    return {
      message: 'This is a protected profile route.',
      user: req.user,
    };
  }
}
