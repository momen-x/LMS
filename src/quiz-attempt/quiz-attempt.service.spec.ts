import { BadRequestException } from '@nestjs/common';
import { QuizAttemptStatus, UserRole } from '@prisma/client';
import { QuizAttemptService } from './quiz-attempt.service';

describe('QuizAttemptService', () => {
  const baseAttempt = {
    id: 'attempt-1',
    studentId: 'student-1',
    quizId: 'quiz-1',
    attemptNumber: 1,
    status: QuizAttemptStatus.in_progress,
    score: null,
    earnedMark: null,
    correctAnswers: null,
    totalQuestions: null,
    startedAt: new Date(),
    submittedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const view = {
    ...baseAttempt,
    quiz: { id: 'quiz-1', totalMark: 10, passingScore: 50 },
    questions: [
      {
        order: 1,
        question: {
          id: 'q1',
          text: 'Question?',
          choices: [{ id: 'c1', text: 'A' }],
        },
      },
    ],
    answers: [] as Array<{ questionId: string; choiceId: string }>,
  };
  const create = () => {
    const repo = {
      findActiveAttempt: jest.fn().mockResolvedValue(null),
      countStudentAttempts: jest.fn().mockResolvedValue(0),
      createWithRandomQuestions: jest.fn().mockResolvedValue(view),
      findStudentView: jest.fn().mockResolvedValue(view),
      findOne: jest.fn().mockResolvedValue(baseAttempt),
      isQuestionAssigned: jest.fn().mockResolvedValue(true),
      choiceBelongsToQuestion: jest.fn().mockResolvedValue(true),
      saveAnswer: jest.fn().mockResolvedValue({ choiceId: 'c1' }),
      submit: jest.fn().mockResolvedValue({
        ...baseAttempt,
        status: QuizAttemptStatus.submitted,
        score: 100,
      }),
      findByStudentAndQuiz: jest.fn().mockResolvedValue([]),
    };
    const quizService = {
      findOrThrow: jest.fn().mockResolvedValue({
        id: 'quiz-1',
        courseId: 'course-1',
        maxAttempts: 2,
      }),
      validateQuizReadAccess: jest.fn().mockResolvedValue(undefined),
    };
    return {
      service: new QuizAttemptService(repo as never, quizService as never),
      repo,
      quizService,
    };
  };

  it('returns the persisted selection and never exposes isCorrect', async () => {
    const { service } = create();
    const result = await service.getAttempt(
      'attempt-1',
      'student-1',
      UserRole.student,
    );
    expect(result.questions).toEqual([
      {
        id: 'q1',
        text: 'Question?',
        order: 1,
        choices: [{ id: 'c1', text: 'A' }],
        selectedChoiceId: null,
      },
    ]);
    expect(JSON.stringify(result)).not.toContain('isCorrect');
  });

  it('returns the same active attempt instead of randomizing again', async () => {
    const { service, repo } = create();
    repo.findActiveAttempt.mockResolvedValue(view);
    await service.startAttempt('student-1', UserRole.student, 'quiz-1');
    expect(repo.createWithRandomQuestions).not.toHaveBeenCalled();
  });

  it('uses quiz.courseId to validate enrollment before starting', async () => {
    const { service, quizService } = create();

    await service.startAttempt('student-1', UserRole.student, 'quiz-1');

    expect(quizService.validateQuizReadAccess).toHaveBeenCalledWith(
      'student-1',
      UserRole.student,
      'course-1',
    );
  });

  it('rejects questions not assigned to the attempt', async () => {
    const { service, repo } = create();
    repo.isQuestionAssigned.mockResolvedValue(false);
    await expect(
      service.saveAnswer('attempt-1', 'q2', 'student-1', UserRole.student, {
        choiceId: 'c2',
      }),
    ).rejects.toThrow('not assigned');
  });

  it('rejects a choice belonging to another question', async () => {
    const { service, repo } = create();
    repo.choiceBelongsToQuestion.mockResolvedValue(false);
    await expect(
      service.saveAnswer('attempt-1', 'q1', 'student-1', UserRole.student, {
        choiceId: 'c2',
      }),
    ).rejects.toThrow('does not belong');
  });

  it('upserts answer changes while the attempt is active', async () => {
    const { service, repo } = create();
    await service.saveAnswer('attempt-1', 'q1', 'student-1', UserRole.student, {
      choiceId: 'c2',
    });
    expect(repo.saveAnswer).toHaveBeenCalledWith('attempt-1', 'q1', 'c2');
  });

  it('prevents answer changes after submission', async () => {
    const { service, repo } = create();
    repo.findOne.mockResolvedValue({
      ...baseAttempt,
      status: QuizAttemptStatus.submitted,
    });
    await expect(
      service.saveAnswer('attempt-1', 'q1', 'student-1', UserRole.student, {
        choiceId: 'c1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces maxAttempts before creating another attempt', async () => {
    const { service, repo } = create();
    repo.countStudentAttempts.mockResolvedValue(2);
    await expect(
      service.startAttempt('student-1', UserRole.student, 'quiz-1'),
    ).rejects.toThrow('maximum');
  });

  it('rejects answer changes after the quiz duration has expired', async () => {
    const { service, repo, quizService } = create();
    repo.findOne.mockResolvedValue({
      ...baseAttempt,
      startedAt: new Date(Date.now() - 61 * 60 * 1000),
    });
    quizService.findOrThrow.mockResolvedValue({
      id: 'quiz-1',
      courseId: 'course-1',
      duration: 30,
    });

    await expect(
      service.saveAnswer('attempt-1', 'q1', 'student-1', UserRole.student, {
        choiceId: 'c1',
      }),
    ).rejects.toThrow('expired');
  });

  it('auto-submits an expired active attempt before creating a new one', async () => {
    const { service, repo, quizService } = create();
    repo.findActiveAttempt.mockResolvedValue({
      ...view,
      startedAt: new Date(Date.now() - 61 * 60 * 1000),
    });
    quizService.findOrThrow.mockResolvedValue({
      id: 'quiz-1',
      courseId: 'course-1',
      duration: 30,
      maxAttempts: 2,
    });
    repo.submit.mockResolvedValue({
      ...baseAttempt,
      status: QuizAttemptStatus.submitted,
    });

    await service.startAttempt('student-1', UserRole.student, 'quiz-1');

    expect(repo.submit).toHaveBeenCalledWith('attempt-1');
  });
});
