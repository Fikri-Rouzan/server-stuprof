import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { StudentsService } from '../students/students.service';
import { AdminService } from '../admin/admin.service';
import { JwtService } from '@nestjs/jwt';
import { HistoryService } from '../history/history.service';
import * as bcrypt from 'bcryptjs';
import { Student } from '../students/schemas/student.schema';

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
    const studentDoc = await this.studentsService.findByNIM(nim);

    if (studentDoc) {
      const isMatch = await bcrypt.compare(pass, studentDoc.password);
      if (isMatch) {
        const { password, ...result } = studentDoc.toObject();
        return result;
      }
    }
    return null;
  }

  async loginStudent(
    student: Omit<Student, 'password'> & { _id: any },
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: student._id,
      role: 'student',
      nim: student.nim,
      name: student.name,
    };
    const accessToken = this.jwtService.sign(payload);

    try {
      await this.historyService.recordLogin(student._id.toString());
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
}
