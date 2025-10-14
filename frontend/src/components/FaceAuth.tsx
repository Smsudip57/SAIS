import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CheckCircle, AlertCircle } from 'lucide-react';

interface FaceAuthProps {
  onSuccess: () => void;
}

export const FaceAuth: React.FC<FaceAuthProps> = ({ onSuccess }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);

  const startFaceAuth = async () => {
    setIsScanning(true);
    setAuthStatus('scanning');

    try {
      // Mock camera access - in real app, use getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Simulate face recognition process
      setTimeout(() => {
        setAuthStatus('success');
        setTimeout(() => {
          // Stop camera stream
          stream.getTracks().forEach(track => track.stop());
          onSuccess();
        }, 1500);
      }, 3000);
    } catch (error) {
      console.error('Camera access denied:', error);
      // Fallback: simulate successful authentication for demo
      setTimeout(() => {
        setAuthStatus('success');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }, 2000);
    }
  };

  const getStatusIcon = () => {
    switch (authStatus) {
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
      case 'scanning':
        return 'Scanning face...';
      case 'success':
        return 'Authentication successful!';
      case 'failed':
        return 'Authentication failed. Please try again.';
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
        disabled={isScanning || authStatus === 'success'}
        className="w-full"
      >
        {authStatus === 'scanning' ? 'Authenticating...' : 
         authStatus === 'success' ? 'Redirecting...' : 
         'Start Face Authentication'}
      </Button>
      
      <div className="text-xs text-center text-gray-500">
        For demo purposes, face authentication will succeed automatically
      </div>
    </div>
  );
};