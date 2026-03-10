import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PDF_QUEUE_NAME } from './jobs.constants';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PdfProcessor } from './pdf.processor';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => InvoicesModule),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? 'localhost',
          port: Number(config.get<string>('REDIS_PORT') ?? '6379'),
        },
      }),
    }),
    BullModule.registerQueue({ name: PDF_QUEUE_NAME }),
  ],
  controllers: [JobsController],
  providers: [JobsService, PdfProcessor],
  exports: [JobsService, BullModule],
})
export class JobsModule {}
