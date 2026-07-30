/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

export type CloudinaryResourceType = 'image' | 'video' | 'raw';

export type UploadedCloudinaryFile = {
  url: string;
  publicId: string;
  resourceType: CloudinaryResourceType;
};

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>(
        'CLOUDINARY_CLOUD_NAME',
      ),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.getOrThrow<string>(
        'CLOUDINARY_API_SECRET',
      ),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'services',
  ): Promise<UploadedCloudinaryFile> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `lms-app/${folder}`,
          resource_type: 'image',
          transformation: [
            {
              width: 500,
              height: 500,
              crop: 'fill',
              gravity: 'face',
            },
            {
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
        },
        (error, result) => {
          if (error || !result) {
            console.error('Cloudinary upload error:', error);

            return reject(error || new Error('Upload failed'));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: 'image',
          });
        },
      );

      try {
        // If file has buffer (memory storage), use it
        if (file.buffer) {
          const readableStream = new Readable();
          readableStream.push(file.buffer);
          readableStream.push(null);
          readableStream.pipe(uploadStream);
        }
        // If file is on disk (disk storage), use the path
        else if (file.path) {
          fs.createReadStream(file.path).pipe(uploadStream);
        } else {
          reject(new Error('File has no buffer or path - cannot upload'));
        }
      } catch (error) {
        console.error('Error preparing file for upload:', error);

        reject(error);
      }
    });
  }

  async uploadMedia(
    file: Express.Multer.File,
    folder: string = 'media',
  ): Promise<UploadedCloudinaryFile> {
    const resourceType = this.getMediaResourceType(file.mimetype);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `lms-app/${folder}`,
          resource_type: resourceType,
          filename_override: file.originalname,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            console.error('Cloudinary media upload error:', error);
            return reject(error || new Error('Media upload failed'));
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType,
          });
        },
      );

      try {
        if (file.buffer) {
          const readableStream = new Readable();
          readableStream.push(file.buffer);
          readableStream.push(null);
          readableStream.pipe(uploadStream);
        } else if (file.path) {
          fs.createReadStream(file.path).pipe(uploadStream);
        } else {
          reject(new Error('File has no buffer or path - cannot upload'));
        }
      } catch (error) {
        console.error('Error preparing media file for upload:', error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'services',
  ): Promise<{ url: string; publicId: string }[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }
  async deleteFile(
    publicId: string,
    resourceType: CloudinaryResourceType = 'image',
  ): Promise<void> {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Cloudinary deletion failed: ${result.result}`);
    }
  }
  async tryDeleteFile(publicId: string): Promise<void> {
    try {
      await this.deleteFile(publicId);
    } catch (error) {
      console.error('Cloudinary cleanup failed:', error);
    }
  }

  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    const deletePromises = publicIds.map((publicId) =>
      this.deleteFile(publicId),
    );
    await Promise.all(deletePromises);
  }

  private getMediaResourceType(mimeType: string): CloudinaryResourceType {
    if (mimeType.startsWith('image/')) {
      return 'image';
    }

    if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
      return 'video';
    }

    return 'raw';
  }
}
