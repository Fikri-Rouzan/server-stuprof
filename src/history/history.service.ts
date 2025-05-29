import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { History, HistoryDocument } from './schemas/history.schema';
import { PopulatedStudentDetailsDto } from './dto/populated-student.dto';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectModel(History.name) private historyModel: Model<HistoryDocument>,
  ) {}

  async findAll(): Promise<
    (Omit<HistoryDocument, 'student'> & {
      student: PopulatedStudentDetailsDto | null;
    })[]
  > {
    const results = await this.historyModel
      .find()
      .populate<{
        student: PopulatedStudentDetailsDto | null;
      }>('student', '_id name nim')
      .sort({ lastLogin: -1 })
      .exec();

    return results.map((historyDoc) => {
      const historyObject = historyDoc.toObject() as Omit<
        HistoryDocument,
        'student'
      > & { student: PopulatedStudentDetailsDto | null };
      return historyObject;
    });
  }

  async clearAll(): Promise<{ message: string; deletedCount?: number }> {
    const result = await this.historyModel.deleteMany({}).exec();
    this.logger.log(
      `All history records deleted. Count: ${result.deletedCount}`,
    );
    return {
      message: 'All history records have been successfully cleared.',
      deletedCount: result.deletedCount,
    };
  }

  async recordLogin(studentId: string): Promise<History> {
    const now = new Date();
    return this.historyModel
      .findOneAndUpdate(
        { student: studentId },
        { $set: { student: studentId, lastLogin: now } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async recordLogout(studentId: string): Promise<History | null> {
    const now = new Date();
    return this.historyModel
      .findOneAndUpdate(
        { student: studentId },
        { $set: { lastLogout: now } },
        { new: true },
      )
      .exec();
  }
}
