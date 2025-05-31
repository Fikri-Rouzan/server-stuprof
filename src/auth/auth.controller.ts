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
import { StudentLoginDto } from './dto/student-login.dto';
import { CreateStudentDto } from '../students/dto/create-student.dto';

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
}
