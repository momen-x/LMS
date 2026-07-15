import { Module } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';
import { PrismaCertificateRepository } from './certificate-prisma.repo';
import { CertificateRepository } from './certificate.repo';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [CertificateController],
  providers: [
    CertificateService,
    { provide: CertificateRepository, useClass: PrismaCertificateRepository },
  ],
  exports: [CertificateService],
  imports: [EnrollmentModule, UsersModule],
})
export class CertificateModule {}
