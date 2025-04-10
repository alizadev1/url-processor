import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FileDownloadService } from '../services/file-download.service';
import { FileTypeService } from '../services/file-type.service';
import { FileContentExtractorService } from '../services/file-content-extractor.service';

@WebSocketGateway({ cors: true })
export class FileProcessingGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly fileDownloadService: FileDownloadService,
    private readonly fileTypeService: FileTypeService,
    private readonly fileContentExtractorService: FileContentExtractorService,
  ) { }

  handleConnection(client: Socket) {
    console.log('Client connected: ' + client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected: ' + client.id);
  }

  @SubscribeMessage('process-files')
  async processFiles(
    @MessageBody() data: { files: { url: string; uuid: string }[] },
    @ConnectedSocket() client: Socket,
  ) {
    const fileContents: Record<string, any> = {};

    for (const { url, uuid } of data.files) {
      try {
        const fileType = await this.fileTypeService.getFileType(url);
        if (!fileType) throw new Error('Unsupported file type');

        const fileBuffer = await this.fileDownloadService.downloadFileWithProgress(
          url,
          uuid,
          client,
        );

        const content = await this.fileContentExtractorService.extractFileContent(
          fileBuffer,
          url,
          fileType,
          client,
        );

        fileContents[url] = content;

        client.emit('file-status', {
          uuid,
          url,
          status: 'success',
          error: null,
          progress: 100,
        });
      } catch (error: unknown) {
        client.emit('file-status', {
          uuid,
          url,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          progress: 0,
        });
      }
    }
    console.log('Extracted file contents:', Object.keys(fileContents));
  }
}
