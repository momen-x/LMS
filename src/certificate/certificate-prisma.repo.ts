import { Injectable } from '@nestjs/common';
import { CertificateRepository } from './certificate.repo';
import { Certificate } from './entities/certificate.entity';
import { CreateCertificateInputs } from './types/certificate.type';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaCertificateRepository implements CertificateRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(inputs: CreateCertificateInputs): Promise<Certificate> {
    return this.prisma.certificate.create({
      data: {
        studentId: inputs.studentId,
        courseId: inputs.courseId,
        certificateNumber: inputs.certificateNumber,
      },
    });
  }
  findById(id: string): Promise<Certificate | null> {
    return this.prisma.certificate.findUnique({
      where: {
        id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            level: true,
            instructor: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }
  findAll(): Promise<Certificate[]> {
    return this.prisma.certificate.findMany();
  }
  findByStudentId(studentId: string): Promise<Certificate[]> {
    return this.prisma.certificate.findMany({
      where: {
        studentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            level: true,
            instructor: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  findByCourseId(courseId: string): Promise<Certificate[]> {
    return this.prisma.certificate.findMany({
      where: {
        courseId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            level: true,
            instructor: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }
  countByCourseId(courseId: string): Promise<number> {
    return this.prisma.certificate.count({ where: { courseId } });
  }
  countByStudentId(studentId: string): Promise<number> {
    return this.prisma.certificate.count({ where: { studentId } });
  }
  countAll(): Promise<number> {
    return this.prisma.certificate.count();
  }

  delete(id: string): Promise<Certificate> {
    return this.prisma.certificate.delete({
      where: {
        id,
      },
    });
  }
  findByCertificateNumber(
    certificateNumber: string,
  ): Promise<Certificate | null> {
    return this.prisma.certificate.findUnique({
      where: {
        certificateNumber,
      },
    });
  }
  findByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<Certificate | null> {
    return this.prisma.certificate.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });
  }
  publicFindByCertificateNumber(
    certificateNumber: string,
  ): Promise<Certificate | null> {
    return this.prisma.certificate.findUnique({
      where: {
        certificateNumber,
      },
      select: {
        id: true,
        certificateNumber: true,
        createdAt: true,
        updatedAt: true,
        issueDate: true,
        course: {
          select: {
            title: true,
            thumbnail: true,
            instructor: {
              select: {
                name: true,
              },
            },
          },
        },
        student: {
          select: {
            name: true,
          },
        },
      },
    }) as unknown as Promise<Certificate | null>;
  }
}
