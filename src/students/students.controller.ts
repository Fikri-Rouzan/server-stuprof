import {
  Controller,
  Post,
  Body,
  ConflictException,
  Get,
  Param,
  NotFoundException,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StudentsService, StudentServiceResponse } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStudent(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<StudentServiceResponse> {
    try {
      return await this.studentsService.create(createStudentDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Get()
  async findAllStudents(): Promise<any[]> {
    return this.studentsService.findAll();
  }

  @Get(':id')
  async findOneStudent(
    @Param('id') id: string,
  ): Promise<StudentServiceResponse> {
    const student = await this.studentsService.findOne(id);
    if (!student) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }
    return student;
  }

  @Put(':id')
  async updateStudent(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<StudentServiceResponse> {
    try {
      const updatedStudent = await this.studentsService.update(
        id,
        updateStudentDto,
      );
      if (!updatedStudent) {
        throw new NotFoundException(
          `Student with ID "${id}" not found for update`,
        );
      }
      return updatedStudent;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async removeStudent(@Param('id') id: string): Promise<{ message: string }> {
    try {
      return await this.studentsService.remove(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
