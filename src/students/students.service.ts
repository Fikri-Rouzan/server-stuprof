import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Student, StudentDocument } from './schemas/student.schema';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
  ) {}

  async create(
    studentData: Omit<Student, 'password'> & { password_plain: string },
  ): Promise<Student> {
    const { nim, password_plain, ...restStudentData } = studentData;

    const existingStudent = await this.studentModel.findOne({ nim }).exec();
    if (existingStudent) {
      throw new ConflictException('NIM already registered');
    }

    const hashedPassword = await bcrypt.hash(password_plain, 10);

    const createdStudent = new this.studentModel({
      nim,
      password: hashedPassword,
      ...restStudentData,
    });

    return createdStudent.save();
  }
}
