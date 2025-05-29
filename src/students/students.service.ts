import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Student, StudentDocument } from './schemas/student.schema';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const { nim, password_plain, dob, ...restStudentData } = createStudentDto;

    const existingStudent = await this.studentModel.findOne({ nim }).exec();
    if (existingStudent) {
      throw new ConflictException('NIM already registered');
    }

    const hashedPassword = await bcrypt.hash(password_plain, 10);

    const createdStudent = new this.studentModel({
      nim,
      name: restStudentData.name,
      password: hashedPassword,
      dob: new Date(dob),
      phone: restStudentData.phone,
      address: restStudentData.address,
      hobby: restStudentData.hobby,
    });

    return createdStudent.save();
  }
}
