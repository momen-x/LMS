import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { LessonService } from './lesson.service';

@Controller()
export class LessonsControllerPreview {
  constructor(private readonly lessonService: LessonService) {}
  @Get('courses/:courseId/preview-lessons')
  @UseGuards(JwtAuthGuard)
  findPreviewLessons(@Param('courseId') courseId: string) {
    return this.lessonService.findPreviewLessons(courseId);
  }
}
