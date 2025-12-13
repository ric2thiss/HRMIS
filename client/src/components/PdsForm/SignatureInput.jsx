import React, { useState, useRef, useEffect } from 'react';

function SignatureInput({ value, onChange, isEditable = true }) {
    const [signatureMode, setSignatureMode] = useState(null); // 'upload' or 'draw'
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initialize canvas
    useEffect(() => {
        if (signatureMode === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            // Set drawing style
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // If there's an existing signature, draw it
            if (value && value.trim() !== '') {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
                img.src = value;
            }
        }
    }, [signatureMode, value]);

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
            onChange({ target: { name: 'signature', value: reader.result } });
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
        if (!isEditable || signatureMode !== 'draw') return;
        e.preventDefault();
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getEventPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
        if (!isDrawing || !isEditable || signatureMode !== 'draw') return;
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
            onChange({ target: { name: 'signature', value: dataURL } });
        }
    };

    const clearSignature = () => {
        if (signatureMode === 'draw' && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        onChange({ target: { name: 'signature', value: '' } });
        setSignatureMode(null);
    };

    // If signature already exists, show it
    if (value && value.trim() !== '' && !signatureMode) {
        return (
            <div className="h-20 border border-gray-400 bg-white relative">
                <div className="relative w-full h-full">
                    <img 
                        src={value} 
                        alt="Signature" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            console.error('Error loading signature');
                            e.target.style.display = 'none';
                        }}
                    />
                    {isEditable && (
                        <button
                            type="button"
                            onClick={clearSignature}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            title="Remove signature"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // If no signature and mode not selected, show choice buttons
    if (!signatureMode) {
        return (
            <div className="h-20 border border-gray-400 bg-white relative">
                <div className="flex flex-col items-center justify-center w-full h-full space-y-2 p-2">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setSignatureMode('upload')}
                            disabled={!isEditable}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Upload Image
                        </button>
                        <button
                            type="button"
                            onClick={() => setSignatureMode('draw')}
                            disabled={!isEditable}
                            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sign Virtually
                        </button>
                    </div>
                    <span className="text-xs text-gray-500">Choose signature method</span>
                </div>
            </div>
        );
    }

    // Upload mode
    if (signatureMode === 'upload') {
        return (
            <div className="h-20 border border-gray-400 bg-white relative">
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={!isEditable}
                        className="hidden"
                    />
                    <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-gray-500 text-center">Click to upload signature image</span>
                </label>
                {isEditable && (
                    <button
                        type="button"
                        onClick={() => setSignatureMode(null)}
                        className="absolute top-1 right-1 bg-gray-500 text-white rounded px-2 py-1 text-xs hover:bg-gray-600"
                        title="Change method"
                    >
                        Change
                    </button>
                )}
            </div>
        );
    }

    // Draw mode
    return (
        <div className="h-20 border border-gray-400 bg-white relative">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair"
                style={{ touchAction: 'none' }}
            />
            {isEditable && (
                <div className="absolute top-1 right-1 flex gap-1">
                    <button
                        type="button"
                        onClick={() => {
                            if (canvasRef.current) {
                                const ctx = canvasRef.current.getContext('2d');
                                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                            }
                        }}
                        className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600"
                        title="Clear"
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        onClick={() => setSignatureMode(null)}
                        className="bg-gray-500 text-white rounded px-2 py-1 text-xs hover:bg-gray-600"
                        title="Change method"
                    >
                        Change
                    </button>
                </div>
            )}
            <div className="absolute bottom-1 left-1 text-xs text-gray-500">
                Sign in the box above
            </div>
        </div>
    );
}

export default SignatureInput;

