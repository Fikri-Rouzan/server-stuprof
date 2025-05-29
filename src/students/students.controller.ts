import { Controller, Post, Body, ConflictException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { Student } from './schemas/student.schema';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  async createStudent(
    @Body() studentData: Omit<Student, 'password'> & { password_plain: string },
  ): Promise<Student> {
    try {
      const student = await this.studentsService.create(studentData);
      return student;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
