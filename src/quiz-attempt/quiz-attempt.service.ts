import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuizAttemptStatus, UserRole } from '@prisma/client';
import { QuizService } from 'src/quiz/quiz.service';
import { SaveAttemptAnswerDto } from './dto/create-quiz-attempt.dto';
import { QuizAttemptRepository, StudentAttemptView } from './quiz-attempt.repo';

@Injectable()
export class QuizAttemptService {
  constructor(
    private readonly repo: QuizAttemptRepository,
    private readonly quizService: QuizService,
  ) {}

  async startAttempt(userId: string, role: UserRole, quizId: string) {
    this.validateStudentRole(role);
    const quiz = await this.quizService.findOrThrow(quizId);
    await this.quizService.validateQuizReadAccess(userId, role, quiz.courseId);
    const active = await this.repo.findActiveAttempt(userId, quizId);
    if (active) return this.mapStudentView(active);
    if (
      (await this.repo.countStudentAttempts(userId, quizId)) >= quiz.maxAttempts
    )
      throw new BadRequestException(
        'You have reached the maximum number of attempts',
      );
    return this.mapStudentView(
      await this.repo.createWithRandomQuestions(userId, quizId),
    );
  }

  async getAttempt(attemptId: string, userId: string, role: UserRole) {
    this.validateStudentRole(role);
    const attempt = await this.repo.findStudentView(attemptId);
    if (!attempt) throw new NotFoundException('Quiz attempt not found');
    this.validateAttemptOwnership(attempt.studentId, userId);
    return this.mapStudentView(attempt);
  }

  async saveAnswer(
    attemptId: string,
    questionId: string,
    userId: string,
    role: UserRole,
    dto: SaveAttemptAnswerDto,
  ) {
    this.validateStudentRole(role);
    const attempt = await this.findOrThrow(attemptId);
    this.validateAttemptOwnership(attempt.studentId, userId);
    this.validateAttemptIsActive(attempt.status);
    if (!(await this.repo.isQuestionAssigned(attemptId, questionId)))
      throw new BadRequestException(
        'This question is not assigned to this attempt',
      );
    if (!(await this.repo.choiceBelongsToQuestion(dto.choiceId, questionId)))
      throw new BadRequestException(
        'This choice does not belong to this question',
      );
    return this.repo.saveAnswer(attemptId, questionId, dto.choiceId);
  }

  async submitAttempt(attemptId: string, userId: string, role: UserRole) {
    this.validateStudentRole(role);
    const attempt = await this.findOrThrow(attemptId);
    this.validateAttemptOwnership(attempt.studentId, userId);
    this.validateAttemptIsActive(attempt.status);
    return this.repo.submit(attemptId);
  }
  async findMyAttempts(userId: string, role: UserRole, quizId: string) {
    this.validateStudentRole(role);
    return this.repo.findByStudentAndQuiz(userId, quizId);
  }
  async findOrThrow(id: string) {
    const attempt = await this.repo.findOne(id);
    if (!attempt) throw new NotFoundException('Quiz attempt not found');
    return attempt;
  }
  private validateStudentRole(role: UserRole) {
    if (role !== UserRole.student)
      throw new ForbiddenException('Only students can perform this action');
  }
  private validateAttemptOwnership(ownerId: string, userId: string) {
    if (ownerId !== userId)
      throw new ForbiddenException(
        'You do not have access to this quiz attempt',
      );
  }
  private validateAttemptIsActive(status: QuizAttemptStatus) {
    if (status !== QuizAttemptStatus.in_progress)
      throw new BadRequestException(
        'This quiz attempt has already been submitted',
      );
  }
  private mapStudentView(attempt: StudentAttemptView) {
    const selected = new Map(
      attempt.answers.map((answer) => [answer.questionId, answer.choiceId]),
    );
    return {
      attemptId: attempt.id,
      quizId: attempt.quizId,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      questions: attempt.questions.map(({ order, question }) => ({
        id: question.id,
        text: question.text,
        order,
        choices: question.choices,
        selectedChoiceId: selected.get(question.id) ?? null,
      })),
    };
  }
}
