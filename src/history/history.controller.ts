import {
  Controller,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryDocument } from './schemas/history.schema';
import { PopulatedStudentDetailsDto } from './dto/populated-student.dto';

@Controller('history')
export class HistoryController {
  private readonly logger = new Logger(HistoryController.name);

  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async findAllHistory(): Promise<
    (Omit<HistoryDocument, 'student'> & {
      student: PopulatedStudentDetailsDto | null;
    })[]
  > {
    this.logger.log('Request to find all history records');
    return this.historyService.findAll();
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearAllHistory(): Promise<{ message: string; deletedCount?: number }> {
    this.logger.log('Request to clear all history records');
    return this.historyService.clearAll();
  }
}
