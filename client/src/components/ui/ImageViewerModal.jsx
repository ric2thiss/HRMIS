import React, { useEffect } from 'react';
import { X, Maximize2 } from 'lucide-react';
import { createPortal } from 'react-dom';

function ImageViewerModal({ imageUrl, alt, onClose }) {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!imageUrl) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors"
          title="Close (ESC)"
        >
          <X size={24} />
        </button>

        {/* Image */}
        <img
          src={imageUrl}
          alt={alt || 'Full view'}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
          onError={(e) => {
            console.error('Image failed to load in modal:', imageUrl);
            e.target.style.display = 'none';
          }}
        />
      </div>
    </div>,
    document.body
  );
}

export default ImageViewerModal;

