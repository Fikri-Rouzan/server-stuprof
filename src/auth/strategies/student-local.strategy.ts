import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Student } from '@prisma/client';

@Injectable()
export class StudentLocalStrategy extends PassportStrategy(
  Strategy,
  'student-local',
) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'nim' });
  }

  async validate(
    nim: string,
    pass: string,
  ): Promise<Omit<Student, 'password'>> {
    const student = await this.authService.validateStudentByCredentials(
      nim,
      pass,
    );

    if (!student) {
      throw new UnauthorizedException('Invalid NIM or password for student');
    }

    return student;
  }
}
