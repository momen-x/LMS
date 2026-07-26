import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuizAttemptStatus, UserRole } from '@prisma/client';

import { QuizAttemptRepository } from './quiz-attempt.repo';
import { QuizService } from 'src/quiz/quiz.service';
import { QuestionService } from 'src/question/question.service';
import { ChoiceService } from 'src/choice/choice.service';
import { SaveAttemptAnswerDto } from './dto/create-quiz-attempt.dto';

@Injectable()
export class QuizAttemptService {
  constructor(
    private readonly quizAttemptRepo: QuizAttemptRepository,
    private readonly quizService: QuizService,
    private readonly questionService: QuestionService,
    private readonly choiceService: ChoiceService,
  ) {}

  async startAttempt(userId: string, role: UserRole, quizId: string) {
    this.validateStudentRole(role);

    const quiz = await this.quizService.findOrThrow(quizId);

    await this.quizService.validateQuizReadAccessByLesson(
      userId,
      role,
      quiz.lessonId,
    );

    const activeAttempt = await this.quizAttemptRepo.findActiveAttempt(
      userId,
      quizId,
    );

    if (activeAttempt) {
      return activeAttempt;
    }

    const attemptsCount = await this.quizAttemptRepo.countStudentAttempts(
      userId,
      quizId,
    );

    if (attemptsCount >= quiz.maxAttempts) {
      throw new BadRequestException(
        'You have reached the maximum number of attempts',
      );
    }

    return this.quizAttemptRepo.create(userId, quizId, attemptsCount + 1);
  }

  async saveAnswer(
    attemptId: string,
    userId: string,
    role: UserRole,
    dto: SaveAttemptAnswerDto,
  ) {
    this.validateStudentRole(role);

    const attempt = await this.findOrThrow(attemptId);

    this.validateAttemptOwnership(attempt.studentId, userId);

    this.validateAttemptIsActive(attempt.status);

    const question = await this.questionService.findOrThrow(dto.questionId);

    if (question.quizId !== attempt.quizId) {
      throw new BadRequestException(
        'This question does not belong to the attempt quiz',
      );
    }

    const choice = await this.choiceService.findOrThrow(dto.choiceId);

    if (choice.questionId !== question.id) {
      throw new BadRequestException(
        'This choice does not belong to this question',
      );
    }

    return this.quizAttemptRepo.saveAnswer(attempt.id, question.id, choice.id);
  }

  async submitAttempt(attemptId: string, userId: string, role: UserRole) {
    this.validateStudentRole(role);

    const attempt = await this.findOrThrow(attemptId);

    this.validateAttemptOwnership(attempt.studentId, userId);

    this.validateAttemptIsActive(attempt.status);

    const totalQuestions = await this.quizAttemptRepo.countQuizQuestions(
      attempt.quizId,
    );

    if (totalQuestions === 0) {
      throw new BadRequestException('This quiz does not contain any questions');
    }

    const answers = await this.quizAttemptRepo.findAnswers(attempt.id);

    const correctAnswers = answers.filter(
      (answer) => answer.choice.isCorrect,
    ).length;

    const score = (correctAnswers / totalQuestions) * 100;

    return this.quizAttemptRepo.submit(attempt.id, {
      status: QuizAttemptStatus.submitted,
      score,
      correctAnswers,
      totalQuestions,
      submittedAt: new Date(),
    });
  }

  async findMyAttempts(userId: string, role: UserRole, quizId: string) {
    this.validateStudentRole(role);

    return this.quizAttemptRepo.findByStudentAndQuiz(userId, quizId);
  }

  async findOrThrow(id: string) {
    const attempt = await this.quizAttemptRepo.findOne(id);

    if (!attempt) {
      throw new NotFoundException('Quiz attempt not found');
    }

    return attempt;
  }

  private validateStudentRole(role: UserRole) {
    if (role !== UserRole.student) {
      throw new ForbiddenException('Only students can perform this action');
    }
  }

  private validateAttemptOwnership(attemptUserId: string, userId: string) {
    if (attemptUserId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this quiz attempt',
      );
    }
  }

  private validateAttemptIsActive(status: QuizAttemptStatus) {
    if (status !== QuizAttemptStatus.in_progress) {
      throw new BadRequestException(
        'This quiz attempt has already been submitted',
      );
    }
  }
  async getAttemptAnswers(attemptId: string, studentId: string) {
    const attempt = await this.findOrThrow(attemptId);

    if (attempt.studentId !== studentId) {
      throw new ForbiddenException(
        'You are not allowed to access this quiz attempt',
      );
    }

    return this.quizAttemptRepo.findAnswersByAttemptId(attemptId);
  }
}
