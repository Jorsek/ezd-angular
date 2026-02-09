import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { vi } from 'vitest';

import { FolderPickerComponent, FolderSelectedEvent } from './folder-picker';

describe('FolderPickerComponent', () => {
  let component: FolderPickerComponent;
  let fixture: ComponentFixture<FolderPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderPickerComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(FolderPickerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    delete (window as Window & { ccmsFolderPicker?: unknown }).ccmsFolderPicker;
  });

  it('should display placeholder when no folder is selected', () => {
    fixture.componentRef.setInput('placeholder', 'Select a folder');
    fixture.detectChanges();
    expect(component['displayName']()).toBe('Select a folder');
  });

  it('should display folder name when provided', () => {
    fixture.componentRef.setInput('folderName', '/content/docs');
    fixture.detectChanges();
    expect(component['displayName']()).toBe('/content/docs');
  });

  it('should indicate when a folder is selected', () => {
    fixture.componentRef.setInput('folderUuid', '123e4567-e89b-12d3-a456-426614174000');
    fixture.detectChanges();
    expect(component['hasFolder']()).toBe(true);
  });

  it('should indicate when no folder is selected', () => {
    fixture.componentRef.setInput('folderUuid', '');
    fixture.detectChanges();
    expect(component['hasFolder']()).toBe(false);
  });

  it('should use custom button text', () => {
    fixture.componentRef.setInput('buttonText', 'Select');
    fixture.detectChanges();
    expect(component.buttonText()).toBe('Select');
  });

  it('should call bridge.open when browse is clicked', () => {
    const openSpy = vi.fn();
    (window as Window & { ccmsFolderPicker?: { open: (id: string) => void } }).ccmsFolderPicker = {
      open: openSpy,
    };

    component['onBrowseClick']();
    expect(openSpy).toHaveBeenCalled();
  });

  it('should warn when bridge is not available', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    component['onBrowseClick']();
    expect(console.warn).toHaveBeenCalledWith('GWT folder picker bridge not available');
  });

  it('should emit folderChange when folder is selected', () => {
    let emittedEvent: FolderSelectedEvent | undefined;
    component.folderChange.subscribe((event) => (emittedEvent = event));

    component['onFolderSelected']('uuid-123', '/content/docs');

    expect(emittedEvent).toEqual({ uuid: 'uuid-123', name: '/content/docs' });
  });

  it('should clean up callback on destroy', () => {
    const callbackKey = Object.keys(window).find((k) => k.startsWith('__ccmsFolderCallback_'));
    expect(callbackKey).toBeTruthy();

    fixture.destroy();

    const callbackKeyAfter = Object.keys(window).find((k) => k.startsWith('__ccmsFolderCallback_'));
    expect(callbackKeyAfter).toBeFalsy();
  });
});
