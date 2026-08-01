import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { CertificateService } from './certificate.service';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorator/user-role.decorator';

@ApiTags('Certificates')
@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class UserCertificatesController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get('me')
  @ApiOperation({ summary: 'Find a my Certificates' })
  @ApiResponse({ status: 200, description: 'Certificate found' })
  @UseGuards(JwtAuthGuard)
  findMyCertificates(@AuthenticatedUser() user: { sub: string }) {
    return this.certificateService.findStudentCertificate(user.sub);
  }
  @Get('me/count')
  @ApiOperation({ summary: 'Count my certificates' })
  countMyCertificates(@AuthenticatedUser() user: { sub: string }) {
    return this.certificateService.countMine(user.sub);
  }
  @Get('count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Count all issued certificates' })
  countAllCertificates(
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.certificateService.countAll(user.role);
  }
  @Get(':userId/certificates')
  @ApiOperation({ summary: 'Find a certificate by user id' })
  @ApiResponse({ status: 200, description: 'Certificate found' })
  @ApiQuery({ name: 'userId', required: true, type: String })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findUserCertificates(@Param('userId') userId: string) {
    return this.certificateService.findStudentCertificate(userId);
  }
}
