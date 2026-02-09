import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceChipComponent } from './resource-chip';
import { Resource } from '../../models/resource-file.interface';

describe('ResourceChipComponent', () => {
  let fixture: ComponentFixture<ResourceChipComponent>;

  const mockResource: Resource = {
    resourceUuid: '123e4567-e89b-12d3-a456-426614174000',
    branchName: 'main',
    resourceCreateTime: '2025-01-15T10:30:00Z',
    path: '/content/topics',
    ezdPath: '/content/topics/intro.dita',
    fileName: 'intro.dita',
    uuid: '123e4567-e89b-12d3-a456-426614174001',
    directoryUuid: '123e4567-e89b-12d3-a456-426614174002',
    ownerUsername: 'jdoe',
    creatorUsername: 'jdoe',
    lastModified: '2025-01-15T10:30:00Z',
    contentMimeType: 'application/dita+xml',
    metadata: {
      title: 'Introduction',
    },
    permOwner: 'jdoe',
    ownerGroup: 'users',
    mode: 'rw-r--r--',
    contentHashMd5: 'd41d8cd98f00b204e9800998ecf8427e',
    contentHashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceChipComponent);
  });

  describe('Display modes', () => {
    it('should default to compact mode', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('resource-chip--compact')).toBe(true);
      expect(fixture.nativeElement.classList.contains('resource-chip--full')).toBe(false);
    });

    it('should apply full mode class when mode is full', () => {
      fixture.componentRef.setInput('mode', 'full');
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('resource-chip--full')).toBe(true);
      expect(fixture.nativeElement.classList.contains('resource-chip--compact')).toBe(false);
    });

    it('should display title in full mode when provided', () => {
      fixture.componentRef.setInput('mode', 'full');
      fixture.componentRef.setInput('title', 'My Topic Title');
      fixture.componentRef.setInput('filename', 'my-topic.dita');
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('.resource-chip__title');
      expect(title).not.toBeNull();
      expect(title.textContent).toBe('My Topic Title');
    });

    it('should not display title element in compact mode even if title provided', () => {
      fixture.componentRef.setInput('mode', 'compact');
      fixture.componentRef.setInput('title', 'My Topic Title');
      fixture.componentRef.setInput('filename', 'my-topic.dita');
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('.resource-chip__title');
      expect(title).toBeNull();
    });

    it('should display filename in both modes', () => {
      fixture.componentRef.setInput('filename', 'my-topic.dita');
      fixture.detectChanges();
      const filename = fixture.nativeElement.querySelector('.resource-chip__filename');
      expect(filename.textContent).toBe('my-topic.dita');

      fixture.componentRef.setInput('mode', 'full');
      fixture.detectChanges();
      const filenameInFull = fixture.nativeElement.querySelector('.resource-chip__filename');
      expect(filenameInFull.textContent).toBe('my-topic.dita');
    });
  });

  describe('Click behavior', () => {
    it('should be clickable when resource is provided', () => {
      fixture.componentRef.setInput('resource', mockResource);
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('resource-chip--clickable')).toBe(true);
      const link = fixture.nativeElement.querySelector('.resource-chip__link');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('/share/123e4567-e89b-12d3-a456-426614174000');
    });

    it('should be clickable when shareUrl is provided directly', () => {
      fixture.componentRef.setInput('filename', 'my-topic.dita');
      fixture.componentRef.setInput('shareUrl', '/custom/share/url');
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('resource-chip--clickable')).toBe(true);
      const link = fixture.nativeElement.querySelector('.resource-chip__link');
      expect(link.getAttribute('href')).toBe('/custom/share/url');
    });

    it('should be clickable when resourceUuid is provided', () => {
      fixture.componentRef.setInput('filename', 'my-topic.dita');
      fixture.componentRef.setInput('resourceUuid', 'abc-123');
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('resource-chip--clickable')).toBe(true);
      const link = fixture.nativeElement.querySelector('.resource-chip__link');
      expect(link.getAttribute('href')).toBe('/share/abc-123');
    });

    it('should not be clickable when no resource, shareUrl, or resourceUuid', () => {
      fixture.componentRef.setInput('filename', 'my-topic.dita');
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('resource-chip--clickable')).toBe(false);
      const link = fixture.nativeElement.querySelector('.resource-chip__link');
      expect(link).toBeNull();
    });

    it('should prefer shareUrl over resourceUuid', () => {
      fixture.componentRef.setInput('filename', 'my-topic.dita');
      fixture.componentRef.setInput('shareUrl', '/custom/url');
      fixture.componentRef.setInput('resourceUuid', 'abc-123');
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('.resource-chip__link');
      expect(link.getAttribute('href')).toBe('/custom/url');
    });
  });

  describe('DITA type detection', () => {
    it('should show topic icon for .dita files', () => {
      fixture.componentRef.setInput('filename', 'intro.dita');
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('resource-chip--topic')).toBe(true);
      const icon = fixture.nativeElement.querySelector('i');
      expect(icon.classList.contains('ji-Topic')).toBe(true);
    });

    it('should show map icon for .ditamap files', () => {
      fixture.componentRef.setInput('filename', 'guide.ditamap');
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('resource-chip--map')).toBe(true);
      const icon = fixture.nativeElement.querySelector('i');
      expect(icon.classList.contains('ji-Map')).toBe(true);
    });

    it('should respect explicit ditaType over filename extension', () => {
      fixture.componentRef.setInput('filename', 'something.xml');
      fixture.componentRef.setInput('ditaType', 'MAP');
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('resource-chip--map')).toBe(true);
    });

    it('should infer NON_DITA for non-DITA file extensions', () => {
      fixture.componentRef.setInput('filename', 'readme.txt');
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('resource-chip--non-dita')).toBe(true);
      expect(fixture.nativeElement.classList.contains('resource-chip--topic')).toBe(false);
      expect(fixture.nativeElement.classList.contains('resource-chip--map')).toBe(false);
      const icon = fixture.nativeElement.querySelector('i');
      expect(icon.classList.contains('ji-File')).toBe(true);
    });

    it('should infer TOPIC from .dita extension when ditaType not provided', () => {
      fixture.componentRef.setInput('filename', 'topic.dita');
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('resource-chip--topic')).toBe(true);
    });

    it('should infer MAP from .ditamap extension when ditaType not provided', () => {
      fixture.componentRef.setInput('filename', 'map.ditamap');
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('resource-chip--map')).toBe(true);
    });
  });

  describe('Title from resource metadata', () => {
    it('should use title from resource metadata in full mode', () => {
      fixture.componentRef.setInput('mode', 'full');
      fixture.componentRef.setInput('resource', mockResource);
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('.resource-chip__title');
      expect(title.textContent).toBe('Introduction');
    });

    it('should prefer explicit title input over resource metadata', () => {
      fixture.componentRef.setInput('mode', 'full');
      fixture.componentRef.setInput('resource', mockResource);
      fixture.componentRef.setInput('title', 'Override Title');
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('.resource-chip__title');
      expect(title.textContent).toBe('Override Title');
    });
  });

  describe('Tooltip', () => {
    it('should show ezdPath as tooltip when provided', () => {
      fixture.componentRef.setInput('filename', 'intro.dita');
      fixture.componentRef.setInput('ezdPath', '/content/topics/intro.dita');
      fixture.detectChanges();
      expect(fixture.nativeElement.getAttribute('title')).toBe('/content/topics/intro.dita');
    });

    it('should show metadata title as tooltip when no ezdPath input', () => {
      fixture.componentRef.setInput('resource', mockResource);
      fixture.detectChanges();
      // Tooltip shows metadata.title when ezdPath input is not provided
      expect(fixture.nativeElement.getAttribute('title')).toBe('Introduction');
    });

    it('should fall back to filename when no ezdPath', () => {
      fixture.componentRef.setInput('filename', 'intro.dita');
      fixture.detectChanges();
      expect(fixture.nativeElement.getAttribute('title')).toBe('intro.dita');
    });
  });
});
