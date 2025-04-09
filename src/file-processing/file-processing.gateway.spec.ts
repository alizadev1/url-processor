import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessingGateway } from './gateway/file-processing.gateway';

describe('FileProcessingGateway', () => {
  let gateway: FileProcessingGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileProcessingGateway],
    }).compile();

    gateway = module.get<FileProcessingGateway>(FileProcessingGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
