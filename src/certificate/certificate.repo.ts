import { Certificate } from './entities/certificate.entity';
import { CreateCertificateInputs } from './types/certificate.type';

export abstract class CertificateRepository {
  abstract create(inputs: CreateCertificateInputs): Promise<Certificate>;
  abstract findById(id: string): Promise<Certificate | null>;
  abstract findAll(): Promise<Certificate[]>;

  abstract delete(id: string): Promise<Certificate>;
  abstract findByCertificateNumber(
    certificateNumber: string,
  ): Promise<Certificate | null>;
  abstract findByStudentId(studentId: string): Promise<Certificate[]>;
  abstract findByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<Certificate | null>;
  abstract findByCourseId(courseId: string): Promise<Certificate[]>;
}
