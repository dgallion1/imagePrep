
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Create a web application that processes user-uploaded images to meet specific digital image requirements. The application should:

## Frontend-Only Architecture

### Core JavaScript Libraries

**For Image Processing:**
- **Pica** - High-quality image resizing
- **Browser-image-compression** - JPEG compression
- **UTIF.js** or similar - Format detection
- **Color.js** - Color profile handling

### Implementation Approach

```javascript
// All processing happens client-side
1. Drag & drop image
2. Read with FileReader API
3. Load into canvas or use libraries
4. Process (resize, compress, convert)
5. Generate blob for download
6. Offer download link
```

### Key Features You Can Implement
1. Accept image uploads through a drag-and-drop interface or file selector
2. Process images with the following requirements:
   - Ensure the longest side is at least 1800 pixels (preferably 1920 pixels)
   - If image is too small, display an error message asking for a higher resolution image
   - If image is too large, automatically resize it proportionally
   - Convert to JPEG format with baseline (standard) encoding
   - Ensure file size is under 5.0 MB (compress if needed while maintaining quality)
   - Convert color profile to sRGB if not already
   - Display warnings if watermarks or text are detected (but don't remove them)

3. Show a preview of the original and processed images side-by-side
4. Display image metadata (dimensions, file size, format) for both versions
5. Provide a download button for the processed image
6. Include clear instructions and real-time feedback during processing

Technical requirements:
- Use HTML5, CSS, and JavaScript (vanilla or with a lightweight library)
- Process images client-side using Canvas API for privacy
- Use docker compose for any containerization needs
- Include proper error handling and user-friendly messages
- Make it responsive and work on both desktop and mobile

The interface should be clean and intuitive, with clear visual indicators for upload areas, processing status, and any warnings or errors.

## Advantages of Client-Side Only

✅ **No server costs** - Completely free to host on GitHub Pages, Netlify, etc.  
✅ **Privacy** - Images never leave user's device  
✅ **Instant processing** - No upload/download time  
✅ **Offline capable** - Works without internet after loading  
✅ **Scalable** - No server to overload  

## Limitations

❌ **Watermark detection** - Limited without AI/ML backends  
❌ **Color profile conversion** - Basic sRGB conversion only  
❌ **Large files** - Browser memory constraints  
❌ **Browser compatibility** - Some features need modern browsers  

## Instructions for Claude Code

```
Create a single-page web application for image preparation:
- No backend needed - pure JavaScript
- Use Pica for high-quality resizing
- Canvas API for JPEG conversion
- Drag-and-drop interface
- Real-time preview
- All processing client-side
- Include these libraries via CDN
```

## Project Structure (Simplified)

```
image-prep-tool/
├── index.html
├── style.css
├── app.js
└── manifest.json (for PWA)
```

You can host this on any static hosting service. Want me to provide specific instructions for Claude Code to build this frontend-only version?