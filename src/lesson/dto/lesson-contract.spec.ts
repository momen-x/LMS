import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateLessonDto } from './create-lesson.dto';
import { UpdateLessonDto } from './update-lesson.dto';
import { CreateSectionDto } from 'src/section/dto/create-section.dto';
import { UpdateSectionDto } from 'src/section/dto/update-section.dto';

describe('system-managed lesson and section fields', () => {
  it.each([
    [
      CreateLessonDto,
      { title: 'Lesson', duration: 10, order: 100, resources: [] },
    ],
    [UpdateLessonDto, { duration: 10, order: 100, resources: [] }],
    [CreateSectionDto, { title: 'Section', order: 100 }],
    [UpdateSectionDto, { order: 100 }],
  ])(
    'rejects non-whitelisted client-managed fields on %p',
    async (Dto, body) => {
      const errors = await validate(plainToInstance(Dto, body), {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      expect(errors.map((error) => error.property)).toEqual(
        expect.arrayContaining(
          Object.keys(body).filter((key) => !['title'].includes(key)),
        ),
      );
    },
  );
});
