import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Camera, Shield } from 'lucide-react';
import { FaceAuth } from './FaceAuth';
import { toast } from 'sonner';
import { useRegisterFaceMutation } from '../../Redux/Api/userApi/User';

interface FaceRegistrationProps {
  onRegistrationComplete?: () => void;
}

export const FaceRegistration: React.FC<FaceRegistrationProps> = ({
  onRegistrationComplete
}) => {
  const [step, setStep] = useState<'info' | 'capture' | 'success'>('info');
  const [registerFace, { isLoading: isRegistering }] = useRegisterFaceMutation();

  const handleStartCapture = () => {
    setStep('capture');
  };

  const handleFaceCaptured = async (faceDescriptor?: number[]) => {
    if (!faceDescriptor) {
      console.error('❌ No face descriptor received');
      toast.error('Failed to capture face descriptor');
      setStep('info');
      return;
    }

    console.log('✅ Face captured, descriptor length:', faceDescriptor.length);

    try {
      console.log('📤 Registering face with Redux API...');

      const response = await registerFace({ faceDescriptor }).unwrap();

      console.log('📊 Response:', response);
      console.log('✅ Face registration successful');

      setStep('success');
      toast.success('Face authentication registered successfully!');

      if (onRegistrationComplete) {
        setTimeout(() => {
          onRegistrationComplete();
        }, 2000);
      }
    } catch (error: any) {
      console.error('❌ Error registering face:', error);
      console.error('Error details:', {
        message: error?.data?.message || error?.message,
        status: error?.status,
        error: error,
      });

      const errorMsg = error?.data?.message ||
        error?.message ||
        'An error occurred while registering face authentication';
      toast.error(`Error: ${errorMsg}`);
      setStep('info');
    }
  };

  const handleError = (error: string) => {
    toast.error(error);
    setStep('info');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <CardTitle>Face Authentication Setup</CardTitle>
        </div>
        <CardDescription>
          Register your face for quick and secure authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 'info' && (
          <>
            <Alert>
              <Camera className="w-4 h-4" />
              <AlertDescription>
                Face authentication provides a secure and convenient way to log in without typing your password.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <h4 className="font-medium">How it works:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>We'll capture a secure representation of your facial features</li>
                  <li>This data is encrypted and stored securely in your account</li>
                  <li>Next time you log in, simply show your face to the camera</li>
                  <li>You can disable this feature anytime from settings</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy & Security
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your facial data never leaves our secure servers and is never shared with third parties.
                  We only store a mathematical representation, not actual photos of your face.
                </p>
              </div>

              <Button
                onClick={handleStartCapture}
                className="w-full"
                size="lg"
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Face Capture
              </Button>
            </div>
          </>
        )}

        {step === 'capture' && (
          <div className="space-y-4">
            <Alert>
              <Camera className="w-4 h-4" />
              <AlertDescription>
                Position your face in the center of the camera view. Make sure you're in a well-lit area.
              </AlertDescription>
            </Alert>

            <FaceAuth
              mode="register"
              onSuccess={handleFaceCaptured}
              onError={handleError}
            />

            <Button
              variant="outline"
              onClick={() => setStep('info')}
              className="w-full"
              disabled={isRegistering}
            >
              Cancel
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Registration Complete!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Face authentication has been enabled for your account. You can now use your face to log in securely.
              </p>
            </div>

            <Button
              onClick={() => onRegistrationComplete && onRegistrationComplete()}
              className="w-full"
            >
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

