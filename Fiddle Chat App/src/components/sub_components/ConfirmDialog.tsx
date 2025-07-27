// components/ConfirmDialog.tsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactDOM from 'react-dom';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isOpen
}) => {
  // 当对话框打开时，禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      // 保存当前的body overflow值
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // 禁止背景滚动
      document.body.style.overflow = 'hidden';
      
      // 清理函数
      return () => {
        // 恢复原始overflow
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // 当用户按Esc键时关闭对话框
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onCancel]);

  // 当对话框未打开时，不渲染任何内容
  if (!isOpen) return null;

  // 使用ReactDOM.createPortal将对话框渲染到body的末尾
  return ReactDOM.createPortal(
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel} // 点击背景关闭对话框
    >
      <motion.div 
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()} // 阻止点击事件冒泡，防止点击内容关闭对话框
      >
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-buttons">
          <motion.button 
            className="cancel-button"
            onClick={onCancel}
            whileHover={{ opacity: 0.85 }}
            whileTap={{ opacity: 0.7 }}
          >
            {cancelLabel}
          </motion.button>
          <motion.button 
            className="confirm-button"
            onClick={onConfirm}
            whileHover={{ opacity: 0.85 }}
            whileTap={{ opacity: 0.7 }}
          >
            {confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default ConfirmDialog;