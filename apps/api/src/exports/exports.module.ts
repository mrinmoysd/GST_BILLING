import { Module } from '@nestjs/common';

import { GstModule } from '../gst/gst.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  imports: [PrismaModule, GstModule],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
