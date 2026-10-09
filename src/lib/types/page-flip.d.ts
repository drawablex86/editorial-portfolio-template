declare module 'page-flip' {
  export class PageFlip {
    constructor(element: HTMLElement, setting: any);
    destroy(): void;
    update(): void;
    loadFromImages(images: string[]): void;
    loadFromHTML(items: NodeListOf<Element> | Element[]): void;
    updateFromImages(images: string[]): void;
    updateFromHtml(items: NodeListOf<Element> | Element[]): void;
    clear(): void;
    turnToPrevPage(): void;
    turnToNextPage(): void;
    turnToPage(pageIndex: number): void;
    flipNext(corner?: string): void;
    flipPrev(corner?: string): void;
    flip(pageIndex: number, corner?: string): void;
    on(event: string, callback: (e: any) => void): void;
    off(event: string): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    getOrientation(): 'landscape' | 'portrait';
    getBoundsRect(): any;
  }
}
