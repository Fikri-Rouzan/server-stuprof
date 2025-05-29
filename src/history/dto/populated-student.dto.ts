import * as mongoose from 'mongoose';

export class PopulatedStudentDetailsDto {
  _id: mongoose.Types.ObjectId;
  name: string;
  nim: string;
}
