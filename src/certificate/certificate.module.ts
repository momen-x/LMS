import { Module } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';
import { PrismaCertificateRepository } from './certificate-prisma.repo';
import { CertificateRepository } from './certificate.repo';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';
import { UsersModule } from 'src/users/users.module';
import { NotificationModule } from 'src/notification/notification.module';
import { CourseModule } from 'src/course/course.module';
import { MineCertificateController } from './certificate-me.controller';

@Module({
  controllers: [CertificateController, MineCertificateController],
  providers: [
    CertificateService,
    { provide: CertificateRepository, useClass: PrismaCertificateRepository },
  ],
  exports: [CertificateService],
  imports: [EnrollmentModule, UsersModule, CourseModule, NotificationModule],
})
export class CertificateModule {}
