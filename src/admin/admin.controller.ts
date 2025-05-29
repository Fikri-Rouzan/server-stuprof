import { Controller, Post, Body, ConflictException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { Admin } from './schemas/admin.schema';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
  ): Promise<Omit<Admin, 'password'>> {
    try {
      return await this.adminService.create(createAdminDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
