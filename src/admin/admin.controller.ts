import { Controller, Post, Body, ConflictException } from '@nestjs/common';
import { AdminService, AdminServiceResponse } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
  ): Promise<AdminServiceResponse> {
    try {
      return await this.adminService.create(createAdminDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      throw error;
    }
  }
}
