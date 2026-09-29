declare module "page-flip" {
  export class PageFlip {
    constructor(element: HTMLElement, settings: object);
    loadFromHTML(pages: HTMLElement[]): void;
    clear(): void;
    flip(page: number): void;
    flipNext(): void;
    flipPrev(): void;
    turnToPage(page: number): void;
  }
}
