import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { History } from '@prisma/client';
import { Prisma } from '@prisma/client';

export type HistoryWithStudent = Prisma.HistoryGetPayload<{
  include: {
    student: {
      select: {
        id: true;
        name: true;
        nim: true;
      };
    };
  };
}>;

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<HistoryWithStudent[]> {
    return this.prisma.history.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nim: true,
          },
        },
      },
      orderBy: {
        lastLogin: 'desc',
      },
    });
  }

  async deleteHistory(
    id: string,
  ): Promise<{ message: string; historyId: string }> {
    try {
      await this.prisma.history.delete({
        where: { id },
      });

      return { message: 'History record deleted successfully', historyId: id };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`History record with ID "${id}" not found`);
      }

      throw error;
    }
  }

  async recordLogin(studentId: string): Promise<History> {
    const now = new Date();

    return this.prisma.history.upsert({
      where: { studentId: studentId },
      create: {
        studentId: studentId,
        lastLogin: now,
      },
      update: {
        lastLogin: now,
      },
    });
  }

  async recordLogout(studentId: string): Promise<History | null> {
    this.logger.debug(
      `Attempting to record logout for studentId: ${studentId}`,
    );

    const now = new Date();

    try {
      const updatedHistoryEntry = await this.prisma.history.update({
        where: { studentId: studentId },
        data: {
          lastLogout: now,
        },
      });

      this.logger.log(
        `Logout successfully recorded for studentId ${studentId}. New lastLogout: ${String(updatedHistoryEntry.lastLogout)}`,
      );

      return updatedHistoryEntry;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2025' || error.code === 'P2016')
      ) {
        this.logger.warn(
          `No history record found for studentId ${studentId} to update lastLogout.`,
        );

        return null;
      }

      throw error;
    }
  }
}
