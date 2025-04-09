import { Injectable } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class FileTypeService {
  private readonly validTypes = [
    'application/pdf',
    'application/json',
    'text/csv',
  ];

  async getFileType(url: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;

      client
        .get(url, (res) => {
          const mimeType = res.headers['content-type']?.split(';')[0].trim();

          if (mimeType && this.validTypes.includes(mimeType)) {
            resolve(mimeType);
          } else {
            reject(new Error('Unsupported file type: ' + mimeType));
          }
        })
        .on('error', reject);
    });
  }
}
