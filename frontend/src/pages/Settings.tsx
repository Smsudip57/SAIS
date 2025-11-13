import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { FaceRegistration } from '@/components/FaceRegistration';
import { useNavigate } from 'react-router-dom';
import { useGetFaceAuthStatusQuery, useUnregisterFaceMutation } from '../../Redux/Api/userApi/User';

export default function Settings() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.auth.user);
    const [showFaceRegistration, setShowFaceRegistration] = useState(false);

    // Redux hooks for face auth
    const { data: faceStatus, isLoading: isLoadingFaceStatus } = useGetFaceAuthStatusQuery({});
    const [unregisterFace] = useUnregisterFaceMutation();

    const faceAuthEnabled = faceStatus?.isEnabled || false;

    const handleDisableFaceAuth = async () => {
        if (!confirm(t('settings.confirmDisableFaceAuth') || 'Are you sure you want to disable face authentication?')) {
            return;
        }

        try {
            await unregisterFace({}).unwrap();
            toast.success(t('settings.faceAuthDisabled') || 'Face authentication disabled');
        } catch (error: any) {
            console.error('Error disabling face auth:', error);
            toast.error(error?.data?.message || t('settings.errorDisablingFaceAuth') || 'An error occurred while disabling face authentication');
        }
    };

    const handleFaceRegistrationComplete = () => {
        setShowFaceRegistration(false);
        toast.success(t('settings.faceAuthEnabled') || 'Face authentication enabled successfully!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header with Back Button */}
                <div className="mb-8 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="h-10 w-10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {t('settings.title')}
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {t('settings.description')}
                        </p>
                    </div>
                </div>

                {/* Face Authentication Card */}
                <Card className="shadow-lg border border-blue-200 dark:border-blue-800">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">{t('settings.biometricTitle')}</CardTitle>
                                    <CardDescription className="mt-1">
                                        {t('settings.biometricDescription')}
                                    </CardDescription>
                                </div>
                            </div>
                            <div className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ${faceAuthEnabled
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                }`}>
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${faceAuthEnabled ? 'bg-green-600' : 'bg-gray-400'
                                    }`}></span>
                                {faceAuthEnabled ? t('settings.status.active') : t('settings.status.inactive')}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                        {/* User Info Section */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('settings.accountInformation')}</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('settings.name')}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {user?.firstName} {user?.lastName}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('settings.email')}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {user?.email}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status and Actions */}
                        {showFaceRegistration ? (
                            <div className="space-y-4">
                                <FaceRegistration
                                    onRegistrationComplete={handleFaceRegistrationComplete}
                                />
                            </div>
                        ) : faceAuthEnabled ? (
                            <div className="space-y-4">
                                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 rounded-lg">
                                    <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <AlertDescription className="text-green-700 dark:text-green-200 ml-2">
                                        {t('settings.activeMessage')}
                                    </AlertDescription>
                                </Alert>

                                <div className="pt-2 space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <strong>{t('settings.canDoList')}</strong>
                                    </p>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                                        <li>✓ {t('settings.canDoItem1')}</li>
                                        <li>✓ {t('settings.canDoItem2')}</li>
                                        <li>✓ {t('settings.canDoItem3')}</li>
                                    </ul>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={() => setShowFaceRegistration(true)}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        {t('settings.updateButton')}
                                    </Button>
                                    <Button
                                        onClick={handleDisableFaceAuth}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        {t('settings.disableButton')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg">
                                    <AlertDescription className="text-blue-700 dark:text-blue-200">
                                        {t('settings.setupMessage')}
                                    </AlertDescription>
                                </Alert>

                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{t('settings.howItWorks')}</h4>
                                    <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-4 list-decimal">
                                        <li>{t('settings.step1')}</li>
                                        <li>{t('settings.step2')}</li>
                                        <li>{t('settings.step3')}</li>
                                        <li>{t('settings.step4')}</li>
                                    </ol>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                    <p className="text-xs text-amber-800 dark:text-amber-200">
                                        <strong>{t('settings.privacyNote')}</strong> {t('settings.privacyText')}
                                    </p>
                                </div>

                                <Button
                                    onClick={() => setShowFaceRegistration(true)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-10"
                                    disabled={isLoadingFaceStatus}
                                >
                                    {isLoadingFaceStatus ? (
                                        t('common.loading')
                                    ) : (
                                        <>
                                            <Shield className="w-4 h-4 mr-2" />
                                            {t('settings.registerButton')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Note */}
                <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        💡 <strong>{t('settings.tip')}</strong> {t('settings.tipText')}
                    </p>
                </div>
            </div>
        </div>
    );
}
