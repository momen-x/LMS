import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { CertificateService } from './certificate.service';

@ApiTags('Certificates')
@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class MineCertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get('me')
  @ApiOperation({ summary: 'Find a certificate by its number' })
  @ApiResponse({ status: 200, description: 'Certificate found' })
  @UseGuards(JwtAuthGuard)
  findMyCertificates(@AuthenticatedUser() user: { sub: string }) {
    return this.certificateService.findStudentCertificate(user.sub);
  }
}
