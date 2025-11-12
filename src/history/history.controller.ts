import {
  Controller,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { HistoryService, HistoryWithStudent } from './history.service';
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
  async findAllHistory(): Promise<HistoryWithStudent[]> {
    this.logger.log(
      'Request to find all history records by an authorized user',
    );

    return this.historyService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteOneHistory(
    @Param('id') id: string,
  ): Promise<{ message: string; historyId: string }> {
    this.logger.log(
      `Request to clear history record ${id} by an authorized admin`,
    );

    try {
      return await this.historyService.deleteHistory(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
