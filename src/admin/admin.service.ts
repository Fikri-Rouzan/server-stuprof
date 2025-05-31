import {
  Injectable,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Admin, AdminDocument } from './schemas/admin.schema';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const seedAdmin = this.configService.get<string>(
      'SEED_ADMIN_ON_START',
      'false',
    );
    if (seedAdmin === 'true') {
      await this.seedInitialAdmin();
    } else {
      this.logger.log(
        'Admin seeding on startup is disabled via SEED_ADMIN_ON_START environment variable.',
      );
    }
  }

  private async seedInitialAdmin() {
    const defaultAdminUsername = this.configService.get<string>(
      'DEFAULT_ADMIN_USERNAME',
    );
    const defaultAdminPassword = this.configService.get<string>(
      'DEFAULT_ADMIN_PASSWORD',
    );

    if (!defaultAdminUsername || !defaultAdminPassword) {
      this.logger.warn(
        'Default admin username or password not found in .env for startup seeding. Skipping.',
      );
      return;
    }
    const existingAdmin = await this.findByUsername(defaultAdminUsername);
    if (existingAdmin) {
      this.logger.log(
        `Default admin user "${defaultAdminUsername}" already exists (checked on startup).`,
      );
      return;
    }
    try {
      await this.create({
        username: defaultAdminUsername,
        password_plain: defaultAdminPassword,
      });
      this.logger.log(
        `Default admin user "${defaultAdminUsername}" created successfully (on startup).`,
      );
    } catch (error) {
      this.logger.error(
        `Error seeding default admin user on startup: ${error.message}`,
        error.stack,
      );
    }
  }

  async findByUsername(username: string): Promise<AdminDocument | null> {
    return this.adminModel.findOne({ username }).exec();
  }

  async create(
    createAdminDto: CreateAdminDto,
  ): Promise<Omit<Admin, 'password'>> {
    const { username, password_plain } = createAdminDto;

    const existingAdmin = await this.findByUsername(username);
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
