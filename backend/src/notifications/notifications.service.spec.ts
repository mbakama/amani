import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { PushSubscription } from './entities/push-subscription.entity';
import { EventReminder } from './entities/event-reminder.entity';
import { Event } from '../events/entities/event.entity';

describe('NotificationsService - Reminder Logic', () => {
  let service: NotificationsService;
  let reminderRepo: Repository<EventReminder>;
  let pushSubRepo: Repository<PushSubscription>;

  beforeEach(async () => {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(PushSubscription),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EventReminder),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Event),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    reminderRepo = module.get<Repository<EventReminder>>(
      getRepositoryToken(EventReminder),
    );
    pushSubRepo = module.get<Repository<PushSubscription>>(
      getRepositoryToken(PushSubscription),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setReminder', () => {
    it('should create a new reminder when enabled is true', async () => {
      const userId = 'user-123';
      const eventId = 'event-456';

      jest.spyOn(reminderRepo, 'findOne').mockResolvedValue(null);
      const mockReminder = { id: 'reminder-789', userId, eventId };
      jest.spyOn(reminderRepo, 'create').mockReturnValue(mockReminder as any);
      jest.spyOn(reminderRepo, 'save').mockResolvedValue(mockReminder as any);

      const result = await service.setReminder(userId, eventId, true);

      expect(reminderRepo.create).toHaveBeenCalledWith({ userId, eventId });
      expect(reminderRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockReminder);
    });

    it('should delete a reminder when enabled is false', async () => {
      const userId = 'user-123';
      const eventId = 'event-456';

      jest
        .spyOn(reminderRepo, 'delete')
        .mockResolvedValue({ affected: 1 } as any);

      const result = await service.setReminder(userId, eventId, false);

      expect(reminderRepo.delete).toHaveBeenCalledWith({ userId, eventId });
      expect(result).toEqual({ deleted: true });
    });

    it('should not create duplicate reminders', async () => {
      const userId = 'user-123';
      const eventId = 'event-456';
      const existingReminder = { id: 'reminder-789', userId, eventId };

      jest
        .spyOn(reminderRepo, 'findOne')
        .mockResolvedValue(existingReminder as any);

      const result = await service.setReminder(userId, eventId, true);

      expect(reminderRepo.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingReminder);
    });
  });

  describe('getUserReminders', () => {
    it('should return list of event IDs for a user', async () => {
      const userId = 'user-123';
      const mockReminders = [
        { eventId: 'event-1' },
        { eventId: 'event-2' },
        { eventId: 'event-3' },
      ];

      jest.spyOn(reminderRepo, 'find').mockResolvedValue(mockReminders as any);

      const result = await service.getUserReminders(userId);

      expect(reminderRepo.find).toHaveBeenCalledWith({
        where: { userId },
        select: ['eventId'],
      });
      expect(result).toEqual(['event-1', 'event-2', 'event-3']);
    });
  });

  describe('subscribe', () => {
    it('should create a new push subscription', async () => {
      const userId = 'user-123';
      const dto = {
        endpoint: 'https://push.example.com/abc',
        p256dh: 'key-p256dh',
        auth: 'key-auth',
      };

      jest.spyOn(pushSubRepo, 'findOne').mockResolvedValue(null);
      const mockSub = { id: 'sub-123', userId, ...dto };
      jest.spyOn(pushSubRepo, 'create').mockReturnValue(mockSub as any);
      jest.spyOn(pushSubRepo, 'save').mockResolvedValue(mockSub as any);

      const result = await service.subscribe(userId, dto);

      expect(pushSubRepo.create).toHaveBeenCalledWith({
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
        expiresAt: null,
      });
      expect(result).toEqual(mockSub);
    });

    it('should update existing push subscription', async () => {
      const userId = 'user-123';
      const dto = {
        endpoint: 'https://push.example.com/abc',
        p256dh: 'key-p256dh-new',
        auth: 'key-auth-new',
      };

      const existingSub = {
        id: 'sub-123',
        userId,
        endpoint: dto.endpoint,
        p256dh: 'key-p256dh-old',
        auth: 'key-auth-old',
      };

      jest.spyOn(pushSubRepo, 'findOne').mockResolvedValue(existingSub as any);
      jest.spyOn(pushSubRepo, 'save').mockResolvedValue({
        ...existingSub,
        ...dto,
      } as any);

      const result = await service.subscribe(userId, dto);

      expect(pushSubRepo.save).toHaveBeenCalled();
      expect(result.p256dh).toBe(dto.p256dh);
      expect(result.auth).toBe(dto.auth);
    });
  });
});
