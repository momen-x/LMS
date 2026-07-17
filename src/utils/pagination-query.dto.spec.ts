import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

describe('PaginationQueryDto', () => {
  it('uses safe defaults', async () => {
    const dto = plainToInstance(PaginationQueryDto, {});

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({ page: 1, limit: 20 });
  });

  it.each([
    [{ page: 0 }, 'page below one'],
    [{ limit: 0 }, 'limit below one'],
    [{ limit: 101 }, 'limit above one hundred'],
    [{ page: 1.5 }, 'non-integer page'],
  ])('rejects %s (%s)', async (input, _description) => {
    const dto = plainToInstance(PaginationQueryDto, input);

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
