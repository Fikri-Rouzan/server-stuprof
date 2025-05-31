import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { StudentsService } from '../students/students.service';
import { AdminService } from '../admin/admin.service';
import { JwtService } from '@nestjs/jwt';
import { HistoryService } from '../history/history.service';
import * as bcrypt from 'bcryptjs';
import { Student } from '../students/schemas/student.schema';
import { CreateStudentDto } from '../students/dto/create-student.dto';

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
  ): Promise<Omit<Student, 'password'> | null> {
    this.logger.debug(`Attempting to validate student with NIM: ${nim}`);
    const studentDoc = await this.studentsService.findByNIM(nim);

    if (!studentDoc) {
      this.logger.warn(
        `Student with NIM "${nim}" not found during validation.`,
      );
      return null;
    }

    this.logger.debug(`Student found: ${studentDoc.name}. Checking password.`);
    const isMatch = await bcrypt.compare(pass, studentDoc.password);

    if (isMatch) {
      this.logger.log(
        `Password match for student "${nim}". Validation successful.`,
      );
      const { password, ...result } = studentDoc.toObject();
      return result;
    } else {
      this.logger.warn(`Password mismatch for student "${nim}".`);
      return null;
    }
  }

  async loginStudent(
    student: Omit<Student, 'password'> & {
      _id: any;
      nim: string;
      name: string;
    },
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: student._id,
      role: 'student',
      nim: student.nim,
      name: student.name,
    };
    const accessToken = this.jwtService.sign(payload);
    this.logger.log(`Generated JWT for student: ${student.nim}`);

    try {
      await this.historyService.recordLogin(student._id.toString());
      this.logger.log(`Login history recorded for student: ${student.nim}`);
    } catch (error) {
      this.logger.error(
        `Failed to record login history for student ${student._id}: ${error.message}`,
        error.stack,
      );
    }

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
        sub: newStudent._id,
        role: 'student',
        nim: newStudent.nim,
        name: newStudent.name,
      };
      const accessToken = this.jwtService.sign(payload);
      this.logger.log(
        `Generated JWT for newly registered student: ${newStudent.nim}`,
      );

      try {
        await this.historyService.recordLogin(newStudent._id.toString());
        this.logger.log(
          `Initial login history recorded for student: ${newStudent.nim}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to record initial login history for student ${newStudent._id}: ${error.message}`,
          error.stack,
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
        `Unexpected error during student registration: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
