class ImagePrepTool {
    constructor() {
        this.files = [];
        this.processedImages = [];
        this.pica = new pica();
        this.initializeElements();
        this.attachEventListeners();
        this.initializeModal();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.selectBtn = document.getElementById('selectFiles');
        this.controls = document.getElementById('controls');
        this.preview = document.getElementById('preview');
        this.imageGrid = document.getElementById('imageGrid');
        this.processBtn = document.getElementById('processAll');
        this.qualitySlider = document.getElementById('quality');
        this.qualityValue = document.getElementById('qualityValue');
        this.upscalingGroup = document.getElementById('upscalingGroup');
        this.allowUpscaling = document.getElementById('allowUpscaling');
        
        // Modal elements
        this.modal = document.getElementById('imageModal');
        this.modalImage = document.getElementById('modalImage');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalDetails = document.getElementById('modalDetails');
        this.modalClose = document.querySelector('.modal-close');
        this.modalBackdrop = document.querySelector('.modal-backdrop');
    }

    attachEventListeners() {
        // File selection
        this.selectBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag and drop
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));

        // Quality slider
        this.qualitySlider.addEventListener('input', (e) => {
            this.qualityValue.textContent = Math.round(e.target.value * 100) + '%';
        });

        // Process button
        this.processBtn.addEventListener('click', this.processAllImages.bind(this));
    }

    initializeModal() {
        // Ensure modal starts hidden
        this.modal.classList.add('hidden');
        
        // Close modal on close button click
        this.modalClose.addEventListener('click', this.closeModal.bind(this));
        
        // Close modal on backdrop click
        this.modalBackdrop.addEventListener('click', this.closeModal.bind(this));
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    openModal(imageSrc, title, details) {
        this.modalImage.src = imageSrc;
        this.modalTitle.textContent = title;
        this.modalDetails.textContent = details;
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    closeModal() {
        this.modal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scrolling
        this.modalImage.src = ''; // Clear image source
        this.modalTitle.textContent = '';
        this.modalDetails.textContent = '';
    }

    attachImageClickHandlers(cardElement, processedImage, index) {
        // Add click handlers to images in this specific card
        const images = cardElement.querySelectorAll('.image-side img');
        images.forEach((img, imgIndex) => {
            img.addEventListener('click', (e) => {
                e.preventDefault();
                const isOriginal = imgIndex === 0; // First image is original, second is processed
                
                const title = isOriginal ? 
                    `Original: ${processedImage.name.replace('_processed.jpg', '')}` : 
                    `Processed: ${processedImage.name}`;
                
                const details = isOriginal ?
                    `${processedImage.originalDimensions.width}×${processedImage.originalDimensions.height} • ${this.formatFileSize(processedImage.originalSize)}` :
                    `${processedImage.newDimensions.width}×${processedImage.newDimensions.height} • ${this.formatFileSize(processedImage.newSize)} • JPEG (sRGB)`;
                
                this.openModal(img.src, title, details);
            });
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        this.handleFiles(files);
    }

    async handleFiles(files) {
        if (files.length === 0) return;
        
        this.files = Array.from(files);
        this.controls.classList.remove('hidden');
        this.updateDropZoneWithPreviews();
        this.showAcceptanceAnimation();
        
        // Check if any images need upscaling and show the option
        await this.checkForSmallImages();
    }

    async updateDropZoneWithPreviews() {
        const content = this.dropZone.querySelector('.drop-zone-content');
        
        if (this.files.length === 1) {
            // Single file - show preview
            this.createSingleFilePreview(content, this.files[0]);
        } else {
            // Multiple files - show grid
            await this.createMultipleFilePreviews(content);
        }
    }

    createSingleFilePreview(container, file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const longestSide = Math.max(img.width, img.height);
                const meetRequirements = longestSide >= 1800;
                const statusColor = meetRequirements ? '#28a745' : '#ffc107';
                
                container.innerHTML = `
                    <div class="file-accepted">
                        <div class="preview-image-container">
                            <img src="${e.target.result}" alt="Preview" class="preview-image">
                            <div class="image-overlay">
                                <div class="check-icon">✓</div>
                            </div>
                        </div>
                        <div class="file-info">
                            <h4>${file.name}</h4>
                            <div class="image-details">
                                <p><strong>Dimensions:</strong> ${img.width} × ${img.height} pixels</p>
                                <p><strong>File Size:</strong> ${this.formatFileSize(file.size)}</p>
                                <p><strong>Format:</strong> ${file.type.split('/')[1].toUpperCase()}</p>
                                <p><strong>Longest Side:</strong> <span style="color: ${statusColor}">${longestSide}px</span></p>
                                ${!meetRequirements ? 
                                    '<p class="size-warning">⚠️ Below 1800px minimum - upscaling will be needed</p>' : 
                                    '<p class="size-ok">✓ Meets minimum size requirements</p>'
                                }
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="select-btn" onclick="document.getElementById('fileInput').click()">
                                Change Image
                            </button>
                        </div>
                    </div>
                `;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async createMultipleFilePreviews(container) {
        // Show loading state first
        container.innerHTML = `
            <div class="file-accepted multiple-files">
                <div class="upload-icon accepted">✓</div>
                <h4>${this.files.length} images selected</h4>
                <p>Analyzing image details...</p>
            </div>
        `;
        
        // Get details for each image
        const fileDetails = await Promise.all(
            this.files.map(async (file) => {
                try {
                    const dimensions = await this.getImageDimensions(file);
                    const longestSide = Math.max(dimensions.width, dimensions.height);
                    const meetRequirements = longestSide >= 1800;
                    
                    return {
                        name: file.name,
                        size: this.formatFileSize(file.size),
                        dimensions: `${dimensions.width}×${dimensions.height}`,
                        longestSide: longestSide,
                        meetRequirements: meetRequirements,
                        format: file.type.split('/')[1].toUpperCase()
                    };
                } catch (error) {
                    return {
                        name: file.name,
                        size: this.formatFileSize(file.size),
                        dimensions: 'Unknown',
                        longestSide: 0,
                        meetRequirements: false,
                        format: file.type.split('/')[1].toUpperCase(),
                        error: true
                    };
                }
            })
        );
        
        const needUpscaling = fileDetails.filter(f => !f.meetRequirements && !f.error).length;
        
        container.innerHTML = `
            <div class="file-accepted multiple-files">
                <div class="upload-icon accepted">✓</div>
                <h4>${this.files.length} images selected</h4>
                ${needUpscaling > 0 ? 
                    `<p class="size-warning">⚠️ ${needUpscaling} image(s) below 1800px minimum</p>` :
                    `<p class="size-ok">✓ All images meet size requirements</p>`
                }
                <div class="file-list detailed">
                    ${fileDetails.map(file => `
                        <div class="file-item detailed">
                            <div class="file-main-info">
                                <span class="file-name">${file.name}</span>
                                <span class="file-size">${file.size}</span>
                            </div>
                            <div class="file-sub-info">
                                <span>${file.dimensions} • ${file.format}</span>
                                <span style="color: ${file.meetRequirements ? '#28a745' : '#ffc107'}">
                                    ${file.longestSide}px
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="action-buttons">
                    <button class="select-btn" onclick="document.getElementById('fileInput').click()">
                        Change Images
                    </button>
                </div>
            </div>
        `;
    }

    showAcceptanceAnimation() {
        // Add acceptance animation class
        this.dropZone.classList.add('accepted');
        
        // Remove the animation class after animation completes
        setTimeout(() => {
            this.dropZone.classList.remove('accepted');
        }, 600);
    }

    async checkForSmallImages() {
        let hasSmallImages = false;
        
        for (const file of this.files) {
            if (file.type.startsWith('image/')) {
                try {
                    const dimensions = await this.getImageDimensions(file);
                    const longestSide = Math.max(dimensions.width, dimensions.height);
                    if (longestSide < 1800) {
                        hasSmallImages = true;
                        break;
                    }
                } catch (error) {
                    console.warn('Could not check dimensions for:', file.name);
                }
            }
        }
        
        // Show or hide the upscaling option
        this.upscalingGroup.style.display = hasSmallImages ? 'block' : 'none';
    }

    getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
                URL.revokeObjectURL(img.src);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    async processAllImages() {
        if (this.files.length === 0) return;

        this.processBtn.disabled = true;
        this.processBtn.textContent = 'Processing...';
        this.processedImages = [];
        this.imageGrid.innerHTML = '';
        this.preview.classList.remove('hidden');

        const settings = this.getProcessingSettings();

        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            try {
                const processedImage = await this.processImage(file, settings);
                this.processedImages.push(processedImage);
                this.addImageToPreview(processedImage, i);
            } catch (error) {
                console.error('Error processing image:', error);
                this.addErrorToPreview(file.name, error.message, i);
            }
        }

        this.processBtn.disabled = false;
        this.processBtn.textContent = 'Process All Images';
    }

    getProcessingSettings() {
        return {
            targetSize: parseInt(document.getElementById('targetSize').value),
            quality: parseFloat(document.getElementById('quality').value),
            maxFileSize: parseFloat(document.getElementById('maxFileSize').value) * 1024 * 1024,
            allowUpscaling: document.getElementById('allowUpscaling').checked
        };
    }

    async processImage(file, settings) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    // Validate image size
                    const validation = this.validateImageSize(img.width, img.height, settings.targetSize, settings.allowUpscaling);
                    if (!validation.valid) {
                        reject(new Error(validation.message));
                        return;
                    }

                    const canvas = document.createElement('canvas');
                    const dimensions = this.calculateNewDimensions(
                        img.width, 
                        img.height, 
                        settings.targetSize,
                        validation.needsUpscaling
                    );

                    canvas.width = dimensions.width;
                    canvas.height = dimensions.height;

                    // Use Pica for high-quality resizing
                    await this.pica.resize(img, canvas, {
                        unsharpAmount: 80,
                        unsharpRadius: 0.6,
                        unsharpThreshold: 2
                    });

                    // Convert to JPEG with quality optimization
                    const blob = await this.optimizeFileSize(canvas, settings.quality, settings.maxFileSize);
                    
                    // Check for potential watermarks/text
                    const warnings = this.detectPotentialIssues(img);
                    
                    resolve({
                        name: this.generateFileName(file.name),
                        originalSize: file.size,
                        newSize: blob.size,
                        originalDimensions: { width: img.width, height: img.height },
                        newDimensions: dimensions,
                        blob: blob,
                        url: URL.createObjectURL(blob),
                        originalUrl: URL.createObjectURL(file),
                        warnings: warnings,
                        wasResized: img.width !== dimensions.width || img.height !== dimensions.height,
                        wasUpscaled: validation.needsUpscaling,
                        originalLongestSide: validation.originalSize || Math.max(img.width, img.height)
                    });
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    validateImageSize(width, height, targetSize, allowUpscaling) {
        const longestSide = Math.max(width, height);
        
        if (longestSide < 1800) {
            if (!allowUpscaling) {
                return {
                    valid: false,
                    message: `Image resolution too small. Longest side is ${longestSide}px, but minimum required is 1800px. Enable upscaling or use a higher resolution image.`
                };
            } else {
                return {
                    valid: true,
                    needsUpscaling: true,
                    originalSize: longestSide
                };
            }
        }
        
        return { valid: true, needsUpscaling: false };
    }

    calculateNewDimensions(originalWidth, originalHeight, targetSize, needsUpscaling = false) {
        const longestSide = Math.max(originalWidth, originalHeight);
        
        // If image is smaller than target and we're not upscaling, keep original size
        if (longestSide < targetSize && !needsUpscaling) {
            return { width: originalWidth, height: originalHeight };
        }
        
        // If image is smaller than 1800 but we're upscaling, scale up to at least 1800
        if (longestSide < 1800 && needsUpscaling) {
            const minTarget = Math.max(1800, targetSize);
            const aspectRatio = originalWidth / originalHeight;
            
            if (originalWidth > originalHeight) {
                return {
                    width: minTarget,
                    height: Math.floor(minTarget / aspectRatio)
                };
            } else {
                return {
                    width: Math.floor(minTarget * aspectRatio),
                    height: minTarget
                };
            }
        }
        
        // If image is already larger than target, scale down proportionally
        if (longestSide > targetSize) {
            const aspectRatio = originalWidth / originalHeight;
            
            if (originalWidth > originalHeight) {
                return {
                    width: targetSize,
                    height: Math.floor(targetSize / aspectRatio)
                };
            } else {
                return {
                    width: Math.floor(targetSize * aspectRatio),
                    height: targetSize
                };
            }
        }
        
        // Image is already the right size
        return { width: originalWidth, height: originalHeight };
    }

    detectPotentialIssues(img) {
        const warnings = [];
        
        // Basic heuristic for detecting potential watermarks/text
        // This is a simplified detection - in a real app you'd use more sophisticated methods
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = Math.min(img.width, 200);
        canvas.height = Math.min(img.height, 200);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Check for high contrast areas that might indicate text/watermarks
            let highContrastPixels = 0;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const brightness = (r + g + b) / 3;
                
                if (brightness < 50 || brightness > 200) {
                    highContrastPixels++;
                }
            }
            
            const contrastRatio = highContrastPixels / (data.length / 4);
            if (contrastRatio > 0.3) {
                warnings.push('Potential watermark or text detected in image');
            }
        } catch (e) {
            // Ignore canvas security errors
        }
        
        return warnings;
    }

    async optimizeFileSize(canvas, initialQuality, maxFileSize) {
        let quality = initialQuality;
        let blob;

        // Binary search for optimal quality
        let minQuality = 0.1;
        let maxQuality = 1.0;

        for (let i = 0; i < 10; i++) {
            blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', quality);
            });

            if (blob.size <= maxFileSize || quality <= minQuality) {
                break;
            }

            if (blob.size > maxFileSize) {
                maxQuality = quality;
                quality = (minQuality + quality) / 2;
            } else {
                minQuality = quality;
                quality = (quality + maxQuality) / 2;
            }
        }

        return blob;
    }

    generateFileName(originalName) {
        const nameWithoutExt = originalName.split('.')[0];
        return `${nameWithoutExt}_processed.jpg`;
    }

    addImageToPreview(processedImage, index) {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        const sizeChange = processedImage.newSize - processedImage.originalSize;
        const sizeChangeRatio = Math.abs(sizeChange) / processedImage.originalSize * 100;
        
        let sizeChangeText;
        if (Math.abs(sizeChange) < 1024) { // Less than 1KB difference
            sizeChangeText = 'File size: No significant change';
        } else if (sizeChange >= 0) {
            sizeChangeText = `File size: Increased by ${sizeChangeRatio.toFixed(1)}%`;
        } else {
            sizeChangeText = `File size: Reduced by ${sizeChangeRatio.toFixed(1)}%`;
        }
        let resizeStatus = 'No changes needed';
        if (processedImage.wasUpscaled) {
            resizeStatus = `Upscaled from ${processedImage.originalLongestSide}px`;
        } else if (processedImage.wasResized) {
            resizeStatus = 'Resized (downscaled)';
        }
        
        let warningsHtml = '';
        
        // Add upscaling warning
        if (processedImage.wasUpscaled) {
            warningsHtml += `<div class="warning-box">⚠️ Image was upscaled from ${processedImage.originalLongestSide}px to meet minimum requirements. This may reduce image quality.</div>`;
        }
        
        // Add other warnings
        if (processedImage.warnings && processedImage.warnings.length > 0) {
            warningsHtml += processedImage.warnings.map(warning => 
                `<div class="warning-box">⚠️ ${warning}</div>`
            ).join('');
        }
        
        card.innerHTML = `
            <div class="image-comparison">
                <div class="image-side">
                    <h5>Original</h5>
                    <img src="${processedImage.originalUrl}" alt="Original image" title="Click to zoom">
                    <p>${processedImage.originalDimensions.width}×${processedImage.originalDimensions.height}</p>
                    <p>${this.formatFileSize(processedImage.originalSize)}</p>
                </div>
                <div class="image-side">
                    <h5>Processed</h5>
                    <img src="${processedImage.url}" alt="Processed image" title="Click to zoom">
                    <p>${processedImage.newDimensions.width}×${processedImage.newDimensions.height}</p>
                    <p>${this.formatFileSize(processedImage.newSize)}</p>
                </div>
            </div>
            <div class="image-info">
                <h4>${processedImage.name}</h4>
                <p><strong>Status:</strong> ${resizeStatus}</p>
                <p><strong>${sizeChangeText}</strong></p>
                <p><strong>Format:</strong> JPEG (baseline, sRGB)</p>
            </div>
            ${warningsHtml}
            <button class="download-btn" onclick="imagePrepTool.downloadImage(${index})">
                Download Processed Image
            </button>
        `;
        
        this.imageGrid.appendChild(card);
        
        // Add click handlers to the newly added images
        this.attachImageClickHandlers(card, processedImage, index);
    }

    addErrorToPreview(fileName, errorMessage, index) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.style.border = '2px solid #dc3545';
        
        card.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 200px; background: #f8d7da; border-radius: 8px; margin-bottom: 15px;">
                <span style="color: #721c24; font-size: 3rem;">❌</span>
            </div>
            <div class="image-info">
                <h4>${fileName}</h4>
                <div class="error-box">
                    <strong>Processing Failed:</strong> ${errorMessage}
                </div>
                <p><strong>Solution:</strong> Please use a higher resolution image with the longest side being at least 1800 pixels.</p>
            </div>
        `;
        
        this.imageGrid.appendChild(card);
    }

    downloadImage(index) {
        const processedImage = this.processedImages[index];
        if (!processedImage) return;

        const link = document.createElement('a');
        link.href = processedImage.url;
        link.download = processedImage.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the application
const imagePrepTool = new ImagePrepTool();

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}