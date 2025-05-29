import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StudentDocument = HydratedDocument<Student>;

@Schema({ timestamps: true })
export class Student {
  @Prop({ type: String, required: true, unique: true })
  nim: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: Date, required: true })
  dob: Date;

  @Prop({ type: String, required: false })
  phone?: string;

  @Prop({ type: String, required: false })
  address?: string;

  @Prop({ type: String, required: false })
  hobby?: string;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
