import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Student } from '../../students/schemas/student.schema';

export type HistoryDocument = mongoose.HydratedDocument<History>;

@Schema({ timestamps: true })
export class History {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  })
  student: Student;

  @Prop({ type: Date, default: null, required: false })
  lastLogin?: Date | null;

  @Prop({ type: Date, default: null, required: false })
  lastLogout?: Date | null;
}

export const HistorySchema = SchemaFactory.createForClass(History);
