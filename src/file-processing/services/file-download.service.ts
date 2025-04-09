import { Injectable } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';
import { Socket } from 'socket.io';

@Injectable()
export class FileDownloadService {
  async downloadFileWithProgress(
    url: string,
    uuid: string,
    client: Socket,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const clientType = url.startsWith('https') ? https : http;

      clientType
        .get(url, (res) => {
          const chunks: Uint8Array[] = [];
          const totalLength = parseInt(res.headers['content-length'] ?? '0', 10);
          let downloaded = 0;

          res
            .on('data', (chunk) => {
              chunks.push(chunk);
              downloaded += chunk.length;

              if (totalLength > 0) {
                const progress = Math.round((downloaded / totalLength) * 100);
                client.emit('file-progress', {
                  uuid,
                  progress,
                  phase: 'downloading',
                });
              }
            })
            .on('end', () => resolve(Buffer.concat(chunks)))
            .on('error', reject);
        })
        .on('error', reject);
    });
  }
}
