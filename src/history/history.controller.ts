import {
  Controller,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('history')
export class HistoryController {
  private readonly logger = new Logger(HistoryController.name);

  constructor(private readonly historyService: HistoryService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findAllHistory(): Promise<any[]> {
    this.logger.log(
      'Request to find all history records by an authorized user',
    );
    return this.historyService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearAllHistory(): Promise<{ message: string; deletedCount?: number }> {
    this.logger.log(
      'Request to clear all history records by an authorized admin',
    );
    return this.historyService.clearAll();
  }
}
