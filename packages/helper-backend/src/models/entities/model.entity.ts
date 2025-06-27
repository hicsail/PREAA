import { ApiProperty } from "@nestjs/swagger";

export class Model {
  @ApiProperty({ description: 'Name of the model' })
  model_name: string;
}
