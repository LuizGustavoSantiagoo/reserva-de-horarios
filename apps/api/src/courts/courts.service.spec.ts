import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ArenaService } from '../arena/arena.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { CourtsService } from './courts.service.js';

describe('CourtsService', () => {
  describe('create', () => {
    function setup({
      existing = null,
      arenaId = 'arena-1',
    }: { existing?: unknown; arenaId?: string | Error } = {}) {
      const findFirst = vi.fn().mockResolvedValue(existing);
      const create = vi.fn().mockResolvedValue({
        id: 'quadra-nova',
        arenaId: 'arena-1',
        name: 'Quadra Nova',
        isActive: true,
      });
      const prisma = {
        court: { findFirst, create },
      } as unknown as PrismaService;
      const findId =
        arenaId instanceof Error
          ? vi.fn().mockRejectedValue(arenaId)
          : vi.fn().mockResolvedValue(arenaId);
      const arena = { findId } as unknown as ArenaService;
      return { service: new CourtsService(prisma, arena), findFirst, create };
    }

    it('grava a quadra ligada à arena única, ativa, e devolve id, arenaId, name e isActive', async () => {
      const { service, findFirst, create } = setup();

      const result = await service.create('Quadra Nova');

      expect(result).toEqual({
        id: 'quadra-nova',
        arenaId: 'arena-1',
        name: 'Quadra Nova',
        isActive: true,
      });
      expect(findFirst).toHaveBeenCalledWith({
        where: {
          arenaId: 'arena-1',
          name: { equals: 'Quadra Nova', mode: 'insensitive' },
        },
        select: { id: true },
      });
      expect(create).toHaveBeenCalledWith({
        data: { arenaId: 'arena-1', name: 'Quadra Nova' },
        select: { id: true, arenaId: true, name: true, isActive: true },
      });
    });

    it('com nome igual a outra quadra da arena (ativa ou inativa) lança 409 e não grava', async () => {
      const { service, create } = setup({ existing: { id: 'quadra-1' } });

      const promise = service.create('quadra nova');

      await expect(promise).rejects.toBeInstanceOf(ConflictException);
      await expect(promise).rejects.toThrow(
        'Já existe uma quadra com este nome.',
      );
      expect(create).not.toHaveBeenCalled();
    });

    it('sem arena propaga o 404 "arena não encontrada" e não grava', async () => {
      const { service, create } = setup({
        arenaId: new NotFoundException('arena não encontrada'),
      });

      await expect(service.create('Quadra Nova')).rejects.toThrow(
        'arena não encontrada',
      );
      expect(create).not.toHaveBeenCalled();
    });
  });
});
