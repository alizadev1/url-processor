import { Module } from '@nestjs/common';
import { FileProcessingGateway } from './file-processing/gateway/file-processing.gateway';
import { FileDownloadService } from './file-processing/services/file-download.service';
import { FileTypeService } from './file-processing/services/file-type.service';
import { FileContentExtractorService } from './file-processing/services/file-content-extractor.service';

@Module({
  imports: [],
  providers: [
    FileProcessingGateway,
    FileDownloadService,
    FileTypeService,
    FileContentExtractorService,
  ],
})
export class AppModule { }

