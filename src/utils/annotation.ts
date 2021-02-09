export interface Annotation {
  position: string;
  onDelete(): void;
  onFocus(): void;
  onUnfocus(): void;
  show(): void;
  hide(): void;
  setOnClickHandler: (handler: any) => void;
  getDesiredPosition(): number;
}
