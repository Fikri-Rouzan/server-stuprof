import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Student, StudentDocument } from './schemas/student.schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
  ) {}

  async create(
    createStudentDto: CreateStudentDto,
  ): Promise<Omit<Student, 'password'>> {
    const { nim, password_plain, dob, ...restStudentData } = createStudentDto;

    const existingStudentByNim = await this.studentModel
      .findOne({ nim })
      .exec();
    if (existingStudentByNim) {
      throw new ConflictException('NIM already registered');
    }

    const hashedPassword = await bcrypt.hash(password_plain, 10);

    const createdStudentDoc = new this.studentModel({
      nim,
      name: restStudentData.name,
      password: hashedPassword,
      dob: new Date(dob),
      phone: restStudentData.phone,
      address: restStudentData.address,
      hobby: restStudentData.hobby,
    });

    const savedStudent = await createdStudentDoc.save();
    const { password, ...result } = savedStudent.toObject();
    return result;
  }

  async findAll(): Promise<Student[]> {
    return this.studentModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentModel
      .findById(id)
      .select('-password')
      .exec();
    if (!student) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }
    return student;
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<Omit<Student, 'password'>> {
    const studentToUpdate = await this.studentModel.findById(id);
    if (!studentToUpdate) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }

    let hashedPassword;
    if (updateStudentDto.password_plain) {
      hashedPassword = await bcrypt.hash(updateStudentDto.password_plain, 10);
      studentToUpdate.password = hashedPassword;
      delete updateStudentDto.password_plain;
    }

    if (updateStudentDto.dob) {
      studentToUpdate.dob = new Date(updateStudentDto.dob);
    }

    if (updateStudentDto.nim && updateStudentDto.nim !== studentToUpdate.nim) {
      const existingStudentByNim = await this.studentModel
        .findOne({ nim: updateStudentDto.nim })
        .exec();
      if (existingStudentByNim && existingStudentByNim._id.toString() !== id) {
        throw new ConflictException(
          `NIM "${updateStudentDto.nim}" already exists for another student.`,
        );
      }
      studentToUpdate.nim = updateStudentDto.nim;
    }

    if (updateStudentDto.name) studentToUpdate.name = updateStudentDto.name;
    if (updateStudentDto.phone) studentToUpdate.phone = updateStudentDto.phone;
    if (updateStudentDto.address)
      studentToUpdate.address = updateStudentDto.address;
    if (updateStudentDto.hobby) studentToUpdate.hobby = updateStudentDto.hobby;

    const updatedStudentDoc = await studentToUpdate.save();

    const { password, ...result } = updatedStudentDoc.toObject();
    return result;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.studentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }
    return { message: `Student with ID "${id}" successfully deleted` };
  }
}
