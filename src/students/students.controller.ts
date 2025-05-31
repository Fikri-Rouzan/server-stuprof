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
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { StudentsService, StudentServiceResponse } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStudentByAdmin(
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findAllStudents(): Promise<any[]> {
    return this.studentsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @Get('me')
  async findMyProfile(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<StudentServiceResponse | null> {
    const studentProfile = await this.studentsService.findOne(req.user.userId);
    if (!studentProfile) {
      throw new NotFoundException('Your student profile was not found.');
    }
    return studentProfile;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @Put('me')
  async updateMyProfile(
    @Request() req: { user: AuthenticatedUser },
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<StudentServiceResponse | null> {
    if (updateStudentDto.nim && updateStudentDto.nim !== req.user.nim) {
      throw new ForbiddenException('You cannot change your NIM.');
    }
    const { nim, ...allowedUpdates } = updateStudentDto;

    return this.studentsService.update(
      req.user.userId,
      allowedUpdates as UpdateStudentDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
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
