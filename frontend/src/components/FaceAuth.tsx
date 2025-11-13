import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';

interface FaceAuthProps {
  mode?: 'login' | 'register';
  email?: string;
  onSuccess: (faceDescriptor?: number[]) => void;
  onError?: (error: string) => void;
}

export const FaceAuth: React.FC<FaceAuthProps> = ({ 
  mode = 'login',
  email,
  onSuccess,
  onError 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'scanning' | 'success' | 'failed'>('idle');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'; // Models should be in public/models folder
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log('Face-api models loaded successfully');
      } catch (error) {
        console.error('Error loading face-api models:', error);
        setErrorMessage('Failed to load face recognition models');
        setModelsLoaded(true); // Continue anyway for fallback
      }
    };

    loadModels();
  }, []);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startFaceAuth = async () => {
    setIsScanning(true);
    setAuthStatus('scanning');
    setErrorMessage('');

    try {
      // Access camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Wait a moment for video to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Detect face and extract descriptor
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          setAuthStatus('failed');
          setErrorMessage('No face detected. Please ensure your face is clearly visible.');
          stopCamera();
          if (onError) onError('No face detected');
          return;
        }

        // Get face descriptor (128-dimensional array)
        const faceDescriptor = Array.from(detection.descriptor);

        if (mode === 'register') {
          // For registration, return the descriptor
          setAuthStatus('success');
          setTimeout(() => {
            stopCamera();
            onSuccess(faceDescriptor);
          }, 1000);
        } else {
          // For login, send to backend for verification
          setAuthStatus('loading');
          
          // Call backend API to verify face
          const response = await fetch('/api/auth/login/face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, faceDescriptor }),
            credentials: 'include',
          });

          const data = await response.json();

          if (data.success) {
            setAuthStatus('success');
            setTimeout(() => {
              stopCamera();
              onSuccess();
            }, 1000);
          } else {
            setAuthStatus('failed');
            setErrorMessage(data.message || 'Face verification failed');
            stopCamera();
            if (onError) onError(data.message || 'Verification failed');
          }
        }
      }
    } catch (error: any) {
      console.error('Face authentication error:', error);
      setAuthStatus('failed');
      setErrorMessage(error.message || 'Camera access denied or face detection failed');
      stopCamera();
      if (onError) onError(error.message || 'Authentication failed');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const getStatusIcon = () => {
    switch (authStatus) {
      case 'loading':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'scanning':
        return <Camera className="w-8 h-8 text-blue-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Camera className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (authStatus) {
      case 'loading':
        return 'Verifying face...';
      case 'scanning':
        return mode === 'register' ? 'Capturing face...' : 'Detecting face...';
      case 'success':
        return mode === 'register' ? 'Face captured successfully!' : 'Authentication successful!';
      case 'failed':
        return errorMessage || 'Authentication failed. Please try again.';
      default:
        return 'Position your face in the camera view';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-48 h-36 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
            {isScanning ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center space-y-2">
                {getStatusIcon()}
                <span className="text-sm text-gray-500">Camera Preview</span>
              </div>
            )}
            
            {authStatus === 'scanning' && (
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg animate-pulse">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium">{getStatusText()}</p>
            {authStatus === 'idle' && (
              <p className="text-xs text-gray-500 mt-1">
                Click the button below to start face authentication
              </p>
            )}
          </div>
        </div>
      </Card>
      
      <Button 
        onClick={startFaceAuth} 
        disabled={!modelsLoaded || isScanning || authStatus === 'success' || authStatus === 'loading'}
        className="w-full"
      >
        {!modelsLoaded ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading models...
          </>
        ) : authStatus === 'scanning' ? (
          mode === 'register' ? 'Capturing...' : 'Detecting...'
        ) : authStatus === 'loading' ? (
          'Verifying...'
        ) : authStatus === 'success' ? (
          mode === 'register' ? 'Captured!' : 'Redirecting...'
        ) : (
          mode === 'register' ? 'Capture Face' : 'Start Face Authentication'
        )}
      </Button>
      
      {errorMessage && (
        <div className="text-xs text-center text-red-500">
          {errorMessage}
        </div>
      )}
      
      {!modelsLoaded && (
        <div className="text-xs text-center text-gray-500">
          Loading face recognition models...
        </div>
      )}
    </div>
  );
};