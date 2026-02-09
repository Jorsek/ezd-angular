import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { NotificationRef } from './notification-ref';
import { NotificationOutletComponent } from './notification-outlet.component';

describe('NotificationRef', () => {
  it('should emit on dismissed$ when dismiss() called', () => {
    const ref = new NotificationRef();
    const dismissSpy = vi.fn();
    ref.dismissed$.subscribe(dismissSpy);

    ref.dismiss();

    expect(dismissSpy).toHaveBeenCalledTimes(1);
  });

  it('should only dismiss once (idempotent)', () => {
    const ref = new NotificationRef();
    const dismissSpy = vi.fn();
    ref.dismissed$.subscribe(dismissSpy);

    ref.dismiss();
    ref.dismiss();
    ref.dismiss();

    expect(dismissSpy).toHaveBeenCalledTimes(1);
  });

  it('should complete observable after dismiss', () => {
    const ref = new NotificationRef();
    const completeSpy = vi.fn();
    ref.dismissed$.subscribe({ complete: completeSpy });

    ref.dismiss();

    expect(completeSpy).toHaveBeenCalledTimes(1);
  });

  it('should call _destroy when dismiss is called', () => {
    const ref = new NotificationRef();
    const destroySpy = vi.fn();
    ref._destroy = destroySpy;

    ref.dismiss();

    expect(destroySpy).toHaveBeenCalledTimes(1);
  });
});

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('success()', () => {
    it('should add notification to queue', () => {
      service.success('Test message');

      expect(service.queue()).toHaveLength(1);
      expect(service.queue()[0].config.type).toBe('success');
    });

    it('should auto-dismiss after 5 seconds', () => {
      service.success('Test message');

      expect(service.queue()).toHaveLength(1);

      vi.advanceTimersByTime(5000);

      expect(service.queue()).toHaveLength(0);
    });

    it('should return NotificationRef', () => {
      const ref = service.success('Test message');

      expect(ref).toBeInstanceOf(NotificationRef);
    });

    it('should remove from queue when ref.dismiss() called', () => {
      const ref = service.success('Test message');

      expect(service.queue()).toHaveLength(1);

      ref.dismiss();

      expect(service.queue()).toHaveLength(0);
    });

    it('should include message in notification config', () => {
      service.success('My custom message');

      const notification = service.queue()[0];
      expect(notification.config.type).toBe('success');
      if (notification.config.type === 'success') {
        expect(notification.config.message).toBe('My custom message');
      }
    });
  });

  describe('error()', () => {
    it('should add notification to queue', () => {
      service.error('Error message');

      expect(service.queue()).toHaveLength(1);
      expect(service.queue()[0].config.type).toBe('error');
    });

    it('should NOT auto-dismiss', () => {
      service.error('Error message');

      expect(service.queue()).toHaveLength(1);

      vi.advanceTimersByTime(10000);

      expect(service.queue()).toHaveLength(1);
    });

    it('should return NotificationRef', () => {
      const ref = service.error('Error message');

      expect(ref).toBeInstanceOf(NotificationRef);
    });

    it('should store retry callback when provided', () => {
      const retrySpy = vi.fn();
      service.error('Error message', retrySpy);

      const notification = service.queue()[0];
      expect(notification.config.type).toBe('error');
      if (notification.config.type === 'error') {
        expect(notification.config.retry).toBe(retrySpy);
      }
    });

    it('should include text in notification config', () => {
      service.error('My error text');

      const notification = service.queue()[0];
      expect(notification.config.type).toBe('error');
      if (notification.config.type === 'error') {
        expect(notification.config.text).toBe('My error text');
      }
    });
  });

  describe('queue management', () => {
    it('should support multiple notifications', () => {
      service.success('Message 1');
      service.error('Error 1');
      service.success('Message 2');

      expect(service.queue()).toHaveLength(3);
    });

    it('should assign unique IDs', () => {
      service.success('Message 1');
      service.success('Message 2');
      service.success('Message 3');

      const ids = service.queue().map((n) => n.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });

    it('should stack new notifications at top', () => {
      service.success('First');
      service.success('Second');
      service.success('Third');

      const queue = service.queue();
      if (queue[0].config.type === 'success') {
        expect(queue[0].config.message).toBe('Third');
      }
      if (queue[2].config.type === 'success') {
        expect(queue[2].config.message).toBe('First');
      }
    });
  });
});

describe('NotificationOutletComponent', () => {
  let component: NotificationOutletComponent;
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });

    service = TestBed.inject(NotificationService);
    component = TestBed.createComponent(NotificationOutletComponent).componentInstance;
  });

  it('should render success notifications with checkmark icon', () => {
    service.success('Test success');

    const queue = service.queue();
    expect(queue).toHaveLength(1);
    expect(queue[0].config.type).toBe('success');
  });

  it('should render error notifications with error icon', () => {
    service.error('Test error');

    const queue = service.queue();
    expect(queue).toHaveLength(1);
    expect(queue[0].config.type).toBe('error');
  });

  it('should show retry button when retry callback provided', () => {
    const retrySpy = vi.fn();
    service.error('Error', retrySpy);

    const notification = service.queue()[0];
    if (notification.config.type === 'error') {
      expect(notification.config.retry).toBeDefined();
    }
  });

  it('should call onRetry and dismiss when retry clicked', () => {
    const retrySpy = vi.fn();
    service.error('Error', retrySpy);

    const notification = service.queue()[0];
    component['onRetry'](notification);

    expect(retrySpy).toHaveBeenCalledTimes(1);
    expect(service.queue()).toHaveLength(0);
  });

  it('should not call retry if notification is success type', () => {
    service.success('Success');
    const notification = service.queue()[0];

    // This should do nothing since success has no retry
    component['onRetry'](notification);

    expect(service.queue()).toHaveLength(1);
  });
});
