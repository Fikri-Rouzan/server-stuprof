import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Admin, AdminDocument } from './schemas/admin.schema';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
  ) {}

  async create(
    createAdminDto: CreateAdminDto,
  ): Promise<Omit<Admin, 'password'>> {
    const { username, password_plain } = createAdminDto;

    const existingAdmin = await this.adminModel.findOne({ username }).exec();
    if (existingAdmin) {
      throw new ConflictException(`Username "${username}" already exists`);
    }

    const hashedPassword = await bcrypt.hash(password_plain, 10);

    const createdAdminDoc = new this.adminModel({
      username,
      password: hashedPassword,
    });

    const savedAdmin = await createdAdminDoc.save();
    const { password, ...result } = savedAdmin.toObject();
    return result;
  }
}
