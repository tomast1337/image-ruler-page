import { percentages } from "./utils";

interface Ruler {
    y: number;
    height: number;
    percentage: number;
}
export class ImageRuler {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private dropZone: HTMLElement;
    private fileInput: HTMLInputElement;
    private previewLine: HTMLElement;
    private clearBtn: HTMLButtonElement;
    private undoBtn: HTMLButtonElement;
    private rulersList: HTMLElement;
    private imageInfo: HTMLElement;

    private currentImage: HTMLImageElement | null = null;
    private rulers: Ruler[] = [];
    private imageScale = 1;
    private imageOffsetX = 0;
    private imageOffsetY = 0;
    private displayedImageWidth = 0;
    private displayedImageHeight = 0;

    constructor() {
        this.canvas = document.getElementById('imageCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.dropZone = document.getElementById('dropZone')!;
        this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
        this.previewLine = document.getElementById('previewLine')!;
        this.clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
        this.undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
        this.rulersList = document.getElementById('rulersList')!;
        this.imageInfo = document.getElementById('imageInfo')!;

        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        // Drag and drop
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));

        // Click to browse files
        this.dropZone.addEventListener('click', this.handleDropZoneClick.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Paste
        document.addEventListener('paste', this.handlePaste.bind(this));

        // Canvas clicks
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleCanvasMouseLeave.bind(this));

        // Buttons
        this.clearBtn.addEventListener('click', this.clearRulers.bind(this));
        this.undoBtn.addEventListener('click', this.undoLastRuler.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    private handleDragOver(e: DragEvent): void {
        e.preventDefault();
        this.dropZone.classList.add('drag-over');
    }

    private handleDragLeave(e: DragEvent): void {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
    }

    private handleDrop(e: DragEvent): void {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            this.loadImageFile(files[0]!);
        }
    }

    private handleDropZoneClick(e: MouseEvent): void {
        console.log('Drop zone clicked!'); // Debug log
        e.preventDefault();
        e.stopPropagation();

        console.log('Triggering file input...'); // Debug log
        this.fileInput.click();
    }

    private handleFileSelect(e: Event): void {
        console.log('File input changed!'); // Debug log
        const target = e.target as HTMLInputElement;
        const files = target.files;
        console.log('Selected files:', files); // Debug log
        if (files && files.length > 0) {
            console.log('Loading file:', files[0]!.name); // Debug log
            this.loadImageFile(files[0]!);
            // Clear the input so the same file can be selected again
            target.value = '';
        }
    }

    private handlePaste(e: ClipboardEvent): void {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    this.loadImageFile(file);
                    break;
                }
            }
        }
    }

    private handleCanvasClick(e: MouseEvent): void {
        if (!this.currentImage) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to image coordinates
        const imageY = (y - this.imageOffsetY) / this.imageScale;

        // Check if click is within image bounds
        if (imageY >= 0 && imageY <= this.currentImage.naturalHeight) {
            this.addRuler(imageY);
        }
    }

    private handleCanvasMouseMove(e: MouseEvent): void {
        if (!this.currentImage) return;

        const rect = this.canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;

        // Convert to image coordinates
        const imageY = (y - this.imageOffsetY) / this.imageScale;

        // Show preview line if within image bounds
        if (imageY >= 0 && imageY <= this.currentImage.naturalHeight) {
            this.previewLine.style.display = 'block';
            this.previewLine.style.top = `${y}px`;
        } else {
            this.previewLine.style.display = 'none';
        }
    }

    private handleCanvasMouseLeave(): void {
        this.previewLine.style.display = 'none';
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Escape') {
            this.clearRulers();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            this.undoLastRuler();
        }
    }

    private handleResize(): void {
        if (this.currentImage) {
            this.drawImage();
        }
    }

    private loadImageFile(file: File): void {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.clearRulers();
                this.drawImage();
                this.updateImageInfo();
                this.showCanvas();
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    private showCanvas(): void {
        this.dropZone.style.display = 'none';
        this.canvas.style.display = 'block';
    }

    private drawImage(): void {
        if (!this.currentImage) return;

        const containerRect = this.canvas.parentElement!.getBoundingClientRect();
        const maxWidth = containerRect.width - 40; // Account for padding
        const maxHeight = window.innerHeight - 250; // Reduced from 300 to allow more space


        // Calculate scale to fit image while preserving aspect ratio
        const scaleX = maxWidth / this.currentImage.naturalWidth;
        const scaleY = maxHeight / this.currentImage.naturalHeight;
        // Allow scaling up to 2x for small images, and ensure minimum scale of 0.5
        const minScale = 0.5;
        const maxScale = 2;
        this.imageScale = Math.max(minScale, Math.min(scaleX, scaleY, maxScale));

        this.displayedImageWidth = this.currentImage.naturalWidth * this.imageScale;
        this.displayedImageHeight = this.currentImage.naturalHeight * this.imageScale;

        // Set canvas size to displayed image size
        this.canvas.width = this.displayedImageWidth;
        this.canvas.height = this.displayedImageHeight;

        // Calculate centering offsets
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;

        // Clear and draw image
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(
            this.currentImage,
            0, 0,
            this.displayedImageWidth,
            this.displayedImageHeight
        );

        // Redraw rulers
        this.drawRulers();
    }

    private addRuler(imageY: number): void {
        // Round to avoid floating point precision issues
        imageY = Math.round(imageY);

        // Check for near-duplicate rulers (within 3 pixels)
        const existingRuler = this.rulers.find(r => Math.abs(r.y - imageY) < 3);
        if (existingRuler) return;

        // Calculate height from previous ruler or top of image
        const previousY = this.rulers.length > 0 ? this.rulers[this.rulers.length - 1]!.y : 0;
        const height = imageY - previousY;

        // Calculate percentage
        const percentage = percentages(this.currentImage!.naturalHeight, [height])[0]!;

        const ruler: Ruler = {
            y: imageY,
            height: height,
            percentage: percentage
        };

        this.rulers.push(ruler);
        this.updateRulersList();
        this.updateButtonStates();
        this.drawRulers();
    }

    private drawRulers(): void {
        if (!this.currentImage) return;

        // Remove existing ruler elements
        const existingRulers = this.canvas.parentElement!.querySelectorAll('.ruler-line, .ruler-label');
        existingRulers.forEach(el => el.remove());

        this.rulers.forEach((ruler, index) => {
            const displayY = ruler.y * this.imageScale + this.imageOffsetY;

            // Create ruler line
            const line = document.createElement('div');
            line.className = 'ruler-line placed';
            line.style.top = `${displayY}px`;
            this.canvas.parentElement!.appendChild(line);

            // Create ruler label
            const label = document.createElement('div');
            label.className = 'ruler-label';
            label.style.top = `${displayY - 15}px`;
            label.style.left = `${this.displayedImageWidth + 10}px`;
            label.innerHTML = `y: <span class="ruler-y">${ruler.y}px</span> — h: <span class="ruler-height">${ruler.height}px</span> — <span class="ruler-percentage">${ruler.percentage.toFixed(3)}%</span>`;

            this.canvas.parentElement!.appendChild(label);
        });
    }

    private updateRulersList(): void {
        if (this.rulers.length === 0) {
            this.rulersList.innerHTML = '<p class="no-rulers">No rulers placed yet</p>';
            return;
        }

        let html = '';
        this.rulers.forEach((ruler, index) => {
            html += `
        <div class="ruler-item">
          <div class="ruler-index">Ruler ${index + 1}</div>
          <div class="ruler-details">
            y: <span class="ruler-y">${ruler.y}px</span> h: <span class="ruler-height">${ruler.height}px</span> %: <span class="ruler-percentage">${ruler.percentage / 100}</span>
          </div>
        </div>
      `;
        });

        this.rulersList.innerHTML = html;
    }

    private updateImageInfo(): void {
        if (!this.currentImage) {
            this.imageInfo.innerHTML = '<p>No image loaded</p>';
            return;
        }

        this.imageInfo.innerHTML = `
      <div><span class="info-label">Original Size:</span><span class="info-value">${this.currentImage.naturalWidth} × ${this.currentImage.naturalHeight}px</span></div>
      <div><span class="info-label">Displayed Size:</span><span class="info-value">${Math.round(this.displayedImageWidth)} × ${Math.round(this.displayedImageHeight)}px</span></div>
      <div><span class="info-label">Scale Factor:</span><span class="info-value">${(this.imageScale * 100).toFixed(1)}%</span></div>
      <div><span class="info-label">Rulers:</span><span class="info-value">${this.rulers.length}</span></div>
    `;
    }

    private updateButtonStates(): void {
        this.clearBtn.disabled = this.rulers.length === 0;
        this.undoBtn.disabled = this.rulers.length === 0;
        this.updateImageInfo();
    }

    private clearRulers(): void {
        this.rulers = [];
        this.updateRulersList();
        this.updateButtonStates();
        this.drawRulers();
    }

    private undoLastRuler(): void {
        if (this.rulers.length > 0) {
            this.rulers.pop();
            this.updateRulersList();
            this.updateButtonStates();
            this.drawRulers();
        }
    }
}
