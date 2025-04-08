import { Module } from '@nestjs/common';
import { FileProcessingGateway } from './file-processing/file-processing.gateway';

@Module({
  imports: [],
  providers: [FileProcessingGateway],
})
export class AppModule {}
