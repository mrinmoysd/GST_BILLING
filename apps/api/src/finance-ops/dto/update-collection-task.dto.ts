import { PartialType } from '@nestjs/swagger';
import { CreateCollectionTaskDto } from './create-collection-task.dto';

export class UpdateCollectionTaskDto extends PartialType(
  CreateCollectionTaskDto,
) {}
