import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-buttons">
          <button onClick={onConfirm}>はい</button>
          <button onClick={onCancel}>いいえ</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
