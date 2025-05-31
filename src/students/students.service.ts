import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types as MongooseTypes } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Student, StudentDocument } from './schemas/student.schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

type StudentAsPlainObject = Student & {
  _id: MongooseTypes.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
};

export type StudentServiceResponse = {
  _id: MongooseTypes.ObjectId;
  nim: string;
  name: string;
  dob: Date;
  phone?: string | null;
  address?: string | null;
  hobby?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
  ) {}

  async create(
    createStudentDto: CreateStudentDto,
  ): Promise<StudentServiceResponse> {
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

    const plainStudentObject = savedStudent.toObject() as StudentAsPlainObject;

    const studentToReturn: StudentServiceResponse = {
      _id: plainStudentObject._id,
      nim: plainStudentObject.nim,
      name: plainStudentObject.name,
      dob: plainStudentObject.dob,
      phone: plainStudentObject.phone,
      address: plainStudentObject.address,
      hobby: plainStudentObject.hobby,
      createdAt: plainStudentObject.createdAt,
      updatedAt: plainStudentObject.updatedAt,
    };
    return studentToReturn;
  }

  async findOne(id: string): Promise<StudentServiceResponse | null> {
    const studentDoc = await this.studentModel.findById(id).exec();
    if (!studentDoc) {
      return null;
    }
    const plainStudentObject = studentDoc.toObject() as StudentAsPlainObject;

    const studentToReturn: StudentServiceResponse = {
      _id: plainStudentObject._id,
      nim: plainStudentObject.nim,
      name: plainStudentObject.name,
      dob: plainStudentObject.dob,
      phone: plainStudentObject.phone,
      address: plainStudentObject.address,
      hobby: plainStudentObject.hobby,
      createdAt: plainStudentObject.createdAt,
      updatedAt: plainStudentObject.updatedAt,
    };
    return studentToReturn;
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<StudentServiceResponse | null> {
    const studentToUpdate = await this.studentModel.findById(id);
    if (!studentToUpdate) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }

    if (updateStudentDto.password_plain) {
      studentToUpdate.password = await bcrypt.hash(
        updateStudentDto.password_plain,
        10,
      );
    }
    if (updateStudentDto.dob)
      studentToUpdate.dob = new Date(updateStudentDto.dob);
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
    if (updateStudentDto.hasOwnProperty('phone'))
      studentToUpdate.phone = updateStudentDto.phone;
    if (updateStudentDto.hasOwnProperty('address'))
      studentToUpdate.address = updateStudentDto.address;
    if (updateStudentDto.hasOwnProperty('hobby'))
      studentToUpdate.hobby = updateStudentDto.hobby;

    const updatedStudentDoc = await studentToUpdate.save();
    const plainUpdatedStudentObject =
      updatedStudentDoc.toObject() as StudentAsPlainObject;

    const studentToReturn: StudentServiceResponse = {
      _id: plainUpdatedStudentObject._id,
      nim: plainUpdatedStudentObject.nim,
      name: plainUpdatedStudentObject.name,
      dob: plainUpdatedStudentObject.dob,
      phone: plainUpdatedStudentObject.phone,
      address: plainUpdatedStudentObject.address,
      hobby: plainUpdatedStudentObject.hobby,
      createdAt: plainUpdatedStudentObject.createdAt,
      updatedAt: plainUpdatedStudentObject.updatedAt,
    };
    return studentToReturn;
  }

  async findAll(): Promise<Student[]> {
    return this.studentModel.find().select('-password').exec();
  }

  async findByNIM(nim: string): Promise<StudentDocument | null> {
    return this.studentModel.findOne({ nim }).exec();
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.studentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }
    return { message: `Student with ID "${id}" successfully deleted` };
  }
}
