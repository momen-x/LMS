import { Review } from '../entities/review.entity';

export type CreateReviewInput = {
  rating: number;
  comment?: string;
};

export type UpdateReviewInput = {
  rating?: number;
  comment?: string;
};

export type SafeReviewStudent = {
  id: string;
  name: string;
  avatar: string | null;
};

export type ReviewWithStudent = Review & { student: SafeReviewStudent };

export type ReviewPage<T = Review> = {
  data: T[];
  total: number;
};

export type CourseRatingAggregate = {
  averageRating: number;
  totalReviews: number;
};
