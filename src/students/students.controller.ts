import { Controller, Post, Body, ConflictException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Student } from './schemas/student.schema';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  async createStudent(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<Student> {
    try {
      const student = await this.studentsService.create(createStudentDto);
      return student;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
