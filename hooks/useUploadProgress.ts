import { useState, useCallback } from 'react';

export interface UploadProgress {
  stage: string;
  percent: number;
}

export const useUploadProgress = () => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const updateProgress = useCallback((newProgress: number, newStage: string) => {
    setProgress(newProgress);
    setStage(newStage);
  }, []);

  const startUpload = useCallback(() => {
    setIsUploading(true);
    setProgress(0);
    setStage('准备上传...');
  }, []);

  const completeUpload = useCallback(() => {
    setProgress(100);
    setStage('上传完成');
    setTimeout(() => {
      setIsUploading(false);
      setProgress(0);
      setStage('');
    }, 500);
  }, []);

  const failUpload = useCallback((errorMessage?: string) => {
    setStage(errorMessage || '上传失败');
    setIsUploading(false);
    setTimeout(() => {
      setProgress(0);
      setStage('');
    }, 2000);
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setStage('');
    setIsUploading(false);
  }, []);

  return {
    progress,
    stage,
    isUploading,
    updateProgress,
    startUpload,
    completeUpload,
    failUpload,
    resetProgress,
  };
};
