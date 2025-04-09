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
import * as http from 'http';
import * as https from 'https';
import * as pdfParse from 'pdf-parse';
import { parse as csvParse } from 'csv-parse';

@WebSocketGateway({ cors: true })
export class FileProcessingGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected: ' + client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected: ' + client.id);
  }

  @SubscribeMessage('process-files')
  async processFiles(
    @MessageBody() data: { urls: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const total = data.urls.length;
    const fileContents: Record<string, any> = {};

    for (let index = 0; index < total; index++) {
      const url = data.urls[index];
      const progress = Math.round(((index + 1) / total) * 100);

      try {
        const fileType = await this.getFileType(url);
        if (!fileType) {
          throw new Error('Unsupported file type');
        }

        const content = await this.extractFileContent(url, fileType);
        fileContents[url] = content;

        client.emit('file-status', {
          url,
          status: 'success',
          error: null,
          progress,
        });
      } catch (error: unknown) {
        client.emit('file-status', {
          url,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          progress,
        });
      }
    }

    console.log('Extracted file contents:', Object.keys(fileContents));
  }

  async getFileType(url: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;

      client
        .get(url, (res) => {
          const mimeType = res.headers['content-type']?.split(';')[0].trim();

          const validTypes = [
            'application/pdf',
            'application/json',
            'text/csv',
          ];

          if (mimeType && validTypes.includes(mimeType)) {
            resolve(mimeType);
          } else {
            reject(new Error('Unsupported file type: ' + mimeType));
          }
        })
        .on('error', reject);
    });
  }

  async extractFileContent(url: string, type: string): Promise<any> {
    const fileBuffer = await this.downloadFile(url);

    if (type === 'application/pdf') {
      const data = await pdfParse(fileBuffer);
      return data.text;
    }

    if (type === 'application/json') {
      return JSON.parse(fileBuffer.toString('utf-8'));
    }

    if (type === 'text/csv') {
      return csvParse(fileBuffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
      });
    }

    throw new Error('Unknown or unsupported file type: ' + type);
  }

  downloadFile(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;

      client
        .get(url, (res) => {
          const chunks: Uint8Array[] = [];

          res
            .on('data', (chunk) => chunks.push(chunk))
            .on('end', () => resolve(Buffer.concat(chunks)))
            .on('error', reject);
        })
        .on('error', reject);
    });
  }
}
