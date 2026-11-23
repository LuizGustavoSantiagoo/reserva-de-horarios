import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ArenaService } from './arena.service.js';

describe('ArenaService', () => {
  describe('findWithCourts', () => {
    it('lê a arena com todas as quadras numa consulta só, por nome, só com id, name e isActive', async () => {
      const arena = {
        id: 'arena-1',
        name: 'Arena Central',
        address: 'Rua das Quadras, 100',
        courts: [
          { id: 'quadra-a', name: 'Quadra A', isActive: false },
          { id: 'quadra-b', name: 'Quadra B', isActive: true },
        ],
      };
      const findFirst = vi.fn().mockResolvedValue(arena);
      const prisma = { arena: { findFirst } } as unknown as PrismaService;

      const result = await new ArenaService(prisma).findWithCourts();

      expect(result).toEqual(arena);
      expect(findFirst).toHaveBeenCalledTimes(1);
      expect(findFirst).toHaveBeenCalledWith({
        include: {
          courts: {
            orderBy: { name: 'asc' },
            select: { id: true, name: true, isActive: true },
          },
        },
      });
    });

    it('sem arena lança NotFoundException "arena não encontrada"', async () => {
      const findFirst = vi.fn().mockResolvedValue(null);
      const prisma = { arena: { findFirst } } as unknown as PrismaService;

      const promise = new ArenaService(prisma).findWithCourts();

      await expect(promise).rejects.toBeInstanceOf(NotFoundException);
      await expect(promise).rejects.toThrow('arena não encontrada');
    });
  });
});
