import {
  Injectable,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Admin } from '@prisma/client';

export type AdminServiceResponse = Omit<Admin, 'password'>;

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
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
    const defaultAdminUsername =
      this.configService.get<string>('ADMIN_USERNAME');
    const defaultAdminPassword =
      this.configService.get<string>('ADMIN_PASSWORD');

    if (!defaultAdminUsername || !defaultAdminPassword) {
      this.logger.warn(
        'Default admin username or password (ADMIN_USERNAME, ADMIN_PASSWORD) not found in .env for startup seeding. Skipping.',
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
      if (error instanceof Error) {
        this.logger.error(
          `Error seeding default admin user on startup: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error('Unknown error during admin seeding', error);
      }
    }
  }

  async findByUsername(username: string): Promise<Admin | null> {
    return this.prisma.admin.findUnique({
      where: { username },
    });
  }

  async create(createAdminDto: CreateAdminDto): Promise<AdminServiceResponse> {
    const { username, password_plain } = createAdminDto;
    const existingAdmin = await this.findByUsername(username);

    if (existingAdmin) {
      throw new ConflictException(`Username "${username}" already exists`);
    }

    const hashedPassword = await bcrypt.hash(password_plain, 10);
    const createdAdmin = await this.prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return createdAdmin;
  }

  async findOneById(id: string): Promise<AdminServiceResponse | null> {
    return this.prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
