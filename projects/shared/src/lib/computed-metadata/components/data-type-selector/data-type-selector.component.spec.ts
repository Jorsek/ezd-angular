import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTypeSelectorComponent } from './data-type-selector.component';

describe('DataTypeSelectorComponent', () => {
  let component: DataTypeSelectorComponent;
  let fixture: ComponentFixture<DataTypeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTypeSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTypeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should default to TEXT with Text label selected', () => {
    expect(component.value()).toBe('TEXT');
    const selectedBtn = fixture.nativeElement.querySelector('.data-type-btn.selected');
    expect(selectedBtn.textContent.trim()).toBe('Text');
  });

  it('should render all 4 data type options', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.data-type-btn');
    expect(buttons.length).toBe(4);
  });

  it('should update value when button clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.data-type-btn');
    buttons[1].click();
    expect(component.value()).toBe('DECIMAL');
  });

  it('should use radiogroup ARIA pattern', () => {
    const host = fixture.nativeElement;
    expect(host.getAttribute('role')).toBe('radiogroup');
  });
});
