import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
// @ts-expect-error - face-api doesn't have complete type declarations
import * as faceapi from '@vladmandic/face-api';
import { useFaceLoginMutation } from '../../Redux/Api/authApi/Auth';

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
  const [faceLogin] = useFaceLoginMutation();
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
        console.log('🔄 Loading face-api models from:', MODEL_URL);

        // Load all models in parallel
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        console.log('✅ All face-api models loaded successfully');
        setModelsLoaded(true);
      } catch (error) {
        console.error('❌ Error loading face-api models:', error);
        setErrorMessage('Failed to load face recognition models. Please refresh the page.');
        // Don't set modelsLoaded to true here - keep button disabled
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

        // Wait for video to stabilize
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Try face detection with retries
        let detection = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (!detection && attempts < maxAttempts) {
          try {
            console.log(`Face detection attempt ${attempts + 1}/${maxAttempts}...`);

            detection = await faceapi
              .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (detection) {
              console.log('✅ Face detected successfully');
              break;
            } else {
              console.warn(`⚠️ No face detected, retrying... (attempt ${attempts + 1}/${maxAttempts})`);
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 800));
              attempts++;
            }
          } catch (detectionError) {
            console.error(`Detection error on attempt ${attempts + 1}:`, detectionError);
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 800));
            }
          }
        }

        if (!detection) {
          setAuthStatus('failed');
          setErrorMessage(
            'Could not detect your face. Please ensure:\n' +
            '• Your face is clearly visible\n' +
            '• You have good lighting\n' +
            '• Your face is centered in the camera\n' +
            '• Try moving closer to the camera'
          );
          stopCamera();
          if (onError) onError('No face detected after multiple attempts');
          return;
        }

        // Get face descriptor (128-dimensional array)
        const faceDescriptor = Array.from(detection.descriptor) as number[];

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

          console.log('📤 Sending face data to backend for verification...');
          console.log('Email:', email);
          console.log('Descriptor length:', faceDescriptor.length);

          try {
            // Call backend API to verify face using Redux
            const response = await faceLogin({ email, faceDescriptor }).unwrap();

            console.log('📊 Backend response:', response);

            if (response.success) {
              console.log('✅ Face verification successful');
              setAuthStatus('success');
              setTimeout(() => {
                stopCamera();
                onSuccess();
              }, 1000);
            } else {
              console.error('❌ Face verification failed:', response);
              setAuthStatus('failed');
              setErrorMessage(response.message || 'Face verification failed. Please try again or use your password.');
              stopCamera();
              if (onError) onError(response.message || 'Verification failed');
            }
          } catch (error: any) {
            console.error('❌ Error during face verification request:', error);
            console.error('Error details:', {
              message: error?.data?.message || error?.message,
              status: error?.status,
              error: error,
            });
            setAuthStatus('failed');
            const errorMsg = error?.data?.message || error?.message || 'Face verification failed';
            setErrorMessage(errorMsg);
            stopCamera();
            if (onError) onError(errorMsg);
          }
        }
      }
    } catch (error: any) {
      console.error('Face authentication error:', error);
      setAuthStatus('failed');

      // Provide specific error messages
      let errorMsg = error.message || 'Camera access denied or face detection failed';
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Camera access was denied. Please allow camera access to use face authentication.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No camera found. Please check your device.';
      }

      setErrorMessage(errorMsg);
      stopCamera();
      if (onError) onError(errorMsg);
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