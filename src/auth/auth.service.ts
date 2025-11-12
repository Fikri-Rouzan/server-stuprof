/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger, ConflictException } from '@nestjs/common';
import {
  StudentsService,
  StudentServiceResponse,
} from '../students/students.service';
import { AdminService, AdminServiceResponse } from '../admin/admin.service';
import { JwtService } from '@nestjs/jwt';
import { HistoryService } from '../history/history.service';
import * as bcrypt from 'bcryptjs';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { AuthenticatedUser, JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private studentsService: StudentsService,
    private adminService: AdminService,
    private jwtService: JwtService,
    private historyService: HistoryService,
  ) {}

  async validateStudentByCredentials(
    nim: string,
    pass: string,
  ): Promise<StudentServiceResponse | null> {
    this.logger.debug(`Attempting to validate student with NIM: ${nim}`);

    const studentDoc = await this.studentsService.findByNIM(nim);

    if (!studentDoc) {
      this.logger.warn(
        `Student with NIM "${nim}" not found during validation.`,
      );

      return null;
    }

    const isMatch = await bcrypt.compare(pass, studentDoc.password);

    if (isMatch) {
      this.logger.log(
        `Password match for student "${nim}". Validation successful.`,
      );

      const { password, ...result } = studentDoc;

      return result;
    } else {
      this.logger.warn(`Password mismatch for student "${nim}".`);

      return null;
    }
  }

  async validateAdminByCredentials(
    username: string,
    pass: string,
  ): Promise<AdminServiceResponse | null> {
    this.logger.debug(
      `Attempting to validate admin with username: ${username}`,
    );

    const adminDoc = await this.adminService.findByUsername(username);

    if (!adminDoc) {
      this.logger.warn(
        `Admin with username "${username}" not found during validation.`,
      );

      return null;
    }

    const isMatch = await bcrypt.compare(pass, adminDoc.password);

    if (isMatch) {
      this.logger.log(`Password match for admin "${username}".`);

      const { password, ...result } = adminDoc;

      return result;
    }
    this.logger.warn(`Password mismatch for admin "${username}".`);

    return null;
  }

  async loginStudent(
    student: StudentServiceResponse,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: student.id,
      role: 'student',
      nim: student.nim,
      name: student.name,
    };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Generated JWT for student: ${student.nim}`);

    try {
      await this.historyService.recordLogin(student.id);

      this.logger.log(`Login history recorded for student: ${student.nim}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to record login history for student ${student.id}: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return {
      access_token: accessToken,
    };
  }

  loginAdmin(admin: AdminServiceResponse): { access_token: string } {
    const payload = {
      sub: admin.id,
      role: 'admin',
      username: admin.username,
    };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Generated JWT for admin: ${admin.username}`);

    return {
      access_token: accessToken,
    };
  }

  async registerStudent(
    createStudentDto: CreateStudentDto,
  ): Promise<{ access_token: string }> {
    try {
      this.logger.log(
        `Attempting to register new student with NIM: ${createStudentDto.nim}`,
      );

      const newStudent = await this.studentsService.create(createStudentDto);

      this.logger.log(
        `Student ${newStudent.nim} - ${newStudent.name} registered successfully.`,
      );

      const payload = {
        sub: newStudent.id,
        role: 'student',
        nim: newStudent.nim,
        name: newStudent.name,
      };
      const accessToken = this.jwtService.sign(payload);

      this.logger.log(
        `Generated JWT for newly registered student: ${newStudent.nim}`,
      );

      try {
        await this.historyService.recordLogin(newStudent.id);

        this.logger.log(
          `Initial login history recorded for student: ${newStudent.nim}`,
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        this.logger.error(
          `Failed to record initial login history for student ${newStudent.id}: ${errorMsg}`,
          error instanceof Error ? error.stack : undefined,
        );
      }

      return { access_token: accessToken };
    } catch (error) {
      if (error instanceof ConflictException) {
        this.logger.warn(
          `Registration failed for NIM ${createStudentDto.nim}: ${error.message}`,
        );

        throw new ConflictException(error.message);
      }

      this.logger.error(
        `Unexpected error during student registration: ${
          error instanceof Error ? error.message : String(error)
        }`,

        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async validateUserFromJwt(
    payload: JwtPayload,
  ): Promise<AuthenticatedUser | null> {
    this.logger.debug(
      `Validating user from JWT payload: ID=${payload.sub}, Role=${payload.role}`,
    );

    if (payload.role === 'student') {
      const student = await this.studentsService.findOne(payload.sub);

      if (student) {
        return {
          userId: payload.sub,
          nim: payload.nim,
          name: payload.name,
          role: 'student',
        };
      }
    } else if (payload.role === 'admin') {
      const admin = await this.adminService.findOneById(payload.sub);

      if (admin) {
        return {
          userId: payload.sub,
          username: payload.username,
          role: 'admin',
        };
      }
    }

    return null;
  }

  async logoutUser(user: AuthenticatedUser): Promise<{ message: string }> {
    this.logger.log(`User logging out: ID=${user.userId}, Role=${user.role}`);

    if (user.role === 'student') {
      try {
        this.logger.debug(`Calling recordLogout for studentId: ${user.userId}`);

        await this.historyService.recordLogout(user.userId);

        this.logger.log(`Logout history recorded for student: ${user.userId}`);
      } catch (error) {
        this.logger.error(
          `Failed to record logout history for student ${user.userId}: ${
            error instanceof Error ? error.message : String(error)
          }`,

          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return { message: 'Successfully logged out' };
  }
}
