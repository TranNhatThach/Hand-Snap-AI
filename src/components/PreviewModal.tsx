import React from 'react';
import { X } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onDownload: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onDownload
}) => {
  if (!isOpen || !imageSrc) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Xem trước ảnh chụp</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="photo-preview-container">
          <img 
            src={imageSrc} 
            className="photo-preview-image" 
            alt="Captured crop preview" 
          />
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Đóng
          </button>
          <button className="btn-primary" onClick={onDownload}>
            Tải xuống
          </button>
        </div>
      </div>
    </div>
  );
};
