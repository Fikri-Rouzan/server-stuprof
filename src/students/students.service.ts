import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Student } from '@prisma/client';
import { Prisma } from '@prisma/client';

export type StudentServiceResponse = Omit<Student, 'password'>;

const studentSelectPublic: Prisma.StudentSelect = {
  id: true,
  nim: true,
  name: true,
  dob: true,
  phone: true,
  address: true,
  hobby: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createStudentDto: CreateStudentDto,
  ): Promise<StudentServiceResponse> {
    const { nim, password_plain, dob, name, phone, address, hobby } =
      createStudentDto;
    const existingStudentByNim = await this.prisma.student.findUnique({
      where: { nim },
    });

    if (existingStudentByNim) {
      throw new ConflictException('NIM already registered');
    }

    const hashedPassword = await bcrypt.hash(password_plain, 10);

    return this.prisma.student.create({
      data: {
        nim: nim,
        name: name,
        password: hashedPassword,
        dob: new Date(dob),
        phone: phone,
        address: address,
        hobby: hobby,
      },
      select: studentSelectPublic,
    });
  }

  async findOne(id: string): Promise<StudentServiceResponse | null> {
    return this.prisma.student.findUnique({
      where: { id },
      select: studentSelectPublic,
    });
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<StudentServiceResponse> {
    const studentToUpdate = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!studentToUpdate) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }

    const dataToUpdate: Prisma.StudentUpdateInput = {};

    if (updateStudentDto.password_plain) {
      dataToUpdate.password = await bcrypt.hash(
        updateStudentDto.password_plain,
        10,
      );
    }

    if (updateStudentDto.nim && updateStudentDto.nim !== studentToUpdate.nim) {
      const existingStudentByNim = await this.prisma.student.findUnique({
        where: { nim: updateStudentDto.nim },
      });

      if (existingStudentByNim && existingStudentByNim.id !== id) {
        throw new ConflictException(
          `NIM "${updateStudentDto.nim}" already exists for another student.`,
        );
      }

      dataToUpdate.nim = updateStudentDto.nim;
    }

    if (updateStudentDto.name) dataToUpdate.name = updateStudentDto.name;

    if (updateStudentDto.dob) dataToUpdate.dob = new Date(updateStudentDto.dob);

    if (Object.prototype.hasOwnProperty.call(updateStudentDto, 'phone'))
      dataToUpdate.phone = updateStudentDto.phone;

    if (Object.prototype.hasOwnProperty.call(updateStudentDto, 'address'))
      dataToUpdate.address = updateStudentDto.address;

    if (Object.prototype.hasOwnProperty.call(updateStudentDto, 'hobby'))
      dataToUpdate.hobby = updateStudentDto.hobby;

    return this.prisma.student.update({
      where: { id },
      data: dataToUpdate,
      select: studentSelectPublic,
    });
  }

  async findAll(): Promise<StudentServiceResponse[]> {
    return this.prisma.student.findMany({
      select: studentSelectPublic,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findByNIM(nim: string): Promise<Student | null> {
    return this.prisma.student.findUnique({
      where: { nim },
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.student.delete({
        where: { id },
      });

      return { message: `Student with ID "${id}" successfully deleted` };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Student with ID "${id}" not found`);
      }

      throw error;
    }
  }
}
