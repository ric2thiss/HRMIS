import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

function SignatureModal({ isOpen, onClose, onSave, currentSignature }) {
    const [signatureMode, setSignatureMode] = useState(null); // 'upload' or 'draw'
    const [isDrawing, setIsDrawing] = useState(false);
    const [signature, setSignature] = useState(currentSignature || '');
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initialize canvas
    useEffect(() => {
        if (signatureMode === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Set canvas size - larger for modal
            canvas.width = 800;
            canvas.height = 300;
            
            // Set drawing style
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // If there's an existing signature, draw it
            if (signature && signature.trim() !== '') {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
                img.src = signature;
            } else {
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [signatureMode, signature]);

    // Reset when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSignature(currentSignature || '');
            setSignatureMode(null);
        }
    }, [isOpen, currentSignature]);

    if (!isOpen) return null;

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setSignature(reader.result);
        };
        reader.onerror = () => {
            alert('Failed to read image file');
        };
        reader.readAsDataURL(file);
    };

    const getEventPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        if (signatureMode !== 'draw') return;
        e.preventDefault();
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getEventPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
        if (!isDrawing || signatureMode !== 'draw') return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getEventPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const stopDrawing = (e) => {
        if (e) e.preventDefault();
        if (!isDrawing) return;
        setIsDrawing(false);
        // Convert canvas to base64
        const canvas = canvasRef.current;
        if (canvas) {
            const dataURL = canvas.toDataURL('image/png');
            setSignature(dataURL);
        }
    };

    const clearSignature = () => {
        if (signatureMode === 'draw' && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setSignature('');
        setSignatureMode(null);
    };

    const handleSave = () => {
        onSave(signature);
        onClose();
    };

    const modalContent = (
        <div 
            className="fixed inset-0 z-[9999] overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                margin: 0,
                padding: '1rem'
            }}
            onClick={(e) => {
                // Close modal when clicking outside
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-4xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">Create E-Signature</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 mb-6">
                        You can either upload an image of your signature or draw it using the virtual signing pad below.
                    </p>

                    {/* Mode Selection */}
                    {!signatureMode && (
                        <div className="flex gap-4 mb-6">
                            <button
                                type="button"
                                onClick={() => setSignatureMode('upload')}
                                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                            >
                                Upload Image
                            </button>
                            <button
                                type="button"
                                onClick={() => setSignatureMode('draw')}
                                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                            >
                                Draw Signature
                            </button>
                        </div>
                    )}

                    {/* Upload Mode */}
                    {signatureMode === 'upload' && (
                        <div className="mb-6">
                            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-gray-500">Click to upload signature image</span>
                                <span className="text-xs text-gray-400 mt-1">Max 2MB, JPG/PNG</span>
                            </label>
                            {signature && (
                                <div className="mt-4 border border-gray-300 rounded-lg p-4 bg-white">
                                    <img 
                                        src={signature} 
                                        alt="Signature Preview" 
                                        className="max-w-full h-auto max-h-48 mx-auto object-contain"
                                    />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setSignatureMode(null)}
                                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                            >
                                Change Method
                            </button>
                        </div>
                    )}

                    {/* Draw Mode */}
                    {signatureMode === 'draw' && (
                        <div className="mb-6">
                            <div className="border-2 border-gray-300 rounded-lg bg-white relative overflow-hidden">
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    className="w-full cursor-crosshair"
                                    style={{ 
                                        touchAction: 'none',
                                        height: '300px',
                                        display: 'block'
                                    }}
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (canvasRef.current) {
                                                const ctx = canvasRef.current.getContext('2d');
                                                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                                                setSignature('');
                                            }
                                        }}
                                        className="bg-red-500 text-white rounded px-3 py-1 text-sm hover:bg-red-600 transition-colors"
                                        title="Clear"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSignatureMode(null)}
                                        className="bg-gray-500 text-white rounded px-3 py-1 text-sm hover:bg-gray-600 transition-colors"
                                        title="Change method"
                                    >
                                        Change Method
                                    </button>
                                </div>
                                <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded">
                                    Sign in the box above
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview of existing signature */}
                    {signature && signatureMode && (
                        <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
                            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                            <img 
                                src={signature} 
                                alt="Signature Preview" 
                                className="max-w-full h-auto max-h-32 mx-auto object-contain border border-gray-200 rounded bg-white p-2"
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        {signature && (
                            <button
                                type="button"
                                onClick={clearSignature}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Remove Signature
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!signature}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Signature
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(
        modalContent,
        document.body
    );
}

export default SignatureModal;

