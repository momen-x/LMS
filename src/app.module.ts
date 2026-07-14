import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { CategoryModule } from './category/category.module';
import { CourseModule } from './course/course.module';
import { SectionModule } from './section/section.module';
import { LessonModule } from './lesson/lesson.module';
import { MediaModule } from './media/media.module';
import { QuizModule } from './quiz/quiz.module';
import { QuestionModule } from './question/question.module';
import { ChoiceModule } from './choice/choice.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MailModule,
    CategoryModule,
    CourseModule,
    SectionModule,
    LessonModule,
    MediaModule,
    QuizModule,
    QuestionModule,
    ChoiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
