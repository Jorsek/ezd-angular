import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { DefinitionFormComponent } from './definition-form.component';
import { ComputedMetadataDefinition } from '../../models';

describe('DefinitionFormComponent', () => {
  let component: DefinitionFormComponent;
  let fixture: ComponentFixture<DefinitionFormComponent>;

  const mockDefinition: ComputedMetadataDefinition = {
    id: 1,
    name: 'author',
    key: 'author',
    dataType: 'TEXT',
    multiValue: false,
    defaultValue: 'Unknown',
    xpaths: ['//author/text()', '//creator/text()'],
    createdUtc: '2024-01-16T12:00:00Z',
    updatedUtc: '2024-01-16T12:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefinitionFormComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(DefinitionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show "New Definition" title in create mode', () => {
    const title = fixture.nativeElement.querySelector('.form-title');
    expect(title.textContent).toContain('New Definition');
  });

  it('should show "Edit Definition" title when definition provided', () => {
    fixture.componentRef.setInput('definition', mockDefinition);
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.form-title');
    expect(title.textContent).toContain('Edit Definition');
  });

  it('should populate form fields in edit mode', () => {
    fixture.componentRef.setInput('definition', mockDefinition);
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('#name') as HTMLInputElement;
    const defaultInput = fixture.nativeElement.querySelector('#defaultValue') as HTMLInputElement;
    const xpathInputs = fixture.nativeElement.querySelectorAll('.xpath-input');

    expect(nameInput.value).toBe('author');
    expect(defaultInput.value).toBe('Unknown');
    expect(xpathInputs.length).toBe(2);
  });

  it('should disable submit button when form is invalid', () => {
    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitBtn.disabled).toBe(true);
  });

  it('should emit formCancel when cancel clicked', () => {
    const cancelSpy = vi.spyOn(component.formCancel, 'emit');
    const cancelBtn = fixture.nativeElement.querySelector('.btn-secondary');
    cancelBtn.click();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should add xpath field when add button clicked', () => {
    const addBtn = fixture.nativeElement.querySelector('.add-xpath-btn');
    addBtn.click();
    fixture.detectChanges();

    const xpathInputs = fixture.nativeElement.querySelectorAll('.xpath-input');
    expect(xpathInputs.length).toBe(2);
  });
});
