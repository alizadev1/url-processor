import { Injectable } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import { parse as csvParse } from 'csv-parse';
import { Socket } from 'socket.io';

@Injectable()
export class FileContentExtractorService {
  async extractFileContent(
    fileBuffer: Buffer,
    type: string,
    uuid: string,
    client: Socket,
  ): Promise<any> {
    client.emit('file-progress', {
      uuid,
      progress: 100,
      phase: 'download complete, parsing',
    });

    if (type === 'application/pdf') {
      const data = await pdfParse(fileBuffer);
      return data.text;
    }

    if (type === 'application/json') {
      return JSON.parse(fileBuffer.toString('utf-8'));
    }

    if (type === 'text/csv') {
      return new Promise((resolve, reject) => {
        csvParse(
          fileBuffer.toString('utf-8'),
          { columns: true, skip_empty_lines: true },
          (err, output) => {
            if (err) reject(err);
            else resolve(output);
          },
        );
      });
    }
    throw new Error('Unsupported file type: ' + type);
  }
}
