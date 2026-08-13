import {
  CourseLevel,
  CourseStatus,
  MediaType,
  QuizAttemptStatus,
  LearningItemType,
} from '@prisma/client';

export type CourseLearning = {
  id: string;
  categoryId: string;
  instructorId: string;
  title: string;
  description: string;
  thumbnail: string | null;
  price: number;
  level: CourseLevel;
  status: CourseStatus;
  language: string;
  averageRating: number;
  totalStudents: number;
  duration: number;
  lessonsCount: number;
  publishedAt: Date | null;
  sections: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      description: string | null;
      duration: number;
      order: number;
      isPreview: boolean;
      media: Array<{
        id: string;
        url: string;
        type: MediaType;
        duration: number | null;
      }>;
    }>;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    questionCount: number;
    totalMark: number;
    passingScore: number;
    maxAttempts: number;
    duration: number;
    attempts: Array<{
      id: string;
      attemptNumber: number;
      status: QuizAttemptStatus;
      score: number | null;
      earnedMark: number | null;
      correctAnswers: number | null;
      totalQuestions: number | null;
      startedAt: Date;
      submittedAt: Date | null;
    }>;
  }>;
  enrollment: {
    id: string;
    progress: number;
    completed: boolean;
    enrolledAt: Date;
    completedAt: Date | null;
    lastLearningType: LearningItemType | null;
    lastLearningItemId: string | null;
    lessonProgress: Array<{
      lessonId: string;
      completed: boolean;
      completedAt: Date | null;
    }>;
  } | null;
};
