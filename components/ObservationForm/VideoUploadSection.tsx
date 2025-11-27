import React, { useRef } from 'react';
import { UploadProgressBar } from '../UploadProgressBar';
import { Spinner } from '../Spinner';
import { VideoObservationDraft } from '../../services/geminiService';
import { VideoKeyframePayload } from '../ObservationForm';

// Icons
const VideoCameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
    />
  </svg>
);

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
    />
  </svg>
);

interface UploadedVideo {
  name: string;
  mimeType: string;
  data: string;
  url: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  keyframes: VideoKeyframePayload[];
}

interface UploadProgress {
  isUploading: boolean;
  progress: number;
  stage: string;
}

interface VideoUploadSectionProps {
  video: UploadedVideo | null;
  uploadProgress: UploadProgress;
  isGeneratingObservation: boolean;
  videoMetadataSummary: string;
  videoProcessingSummary: string;
  videoObservationDraft: VideoObservationDraft | null;
  onVideoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: () => void;
  onGenerateObservation: () => void;
  isBusy: boolean;
  observationText: string;
}

export const VideoUploadSection: React.FC<VideoUploadSectionProps> = ({
  video,
  uploadProgress,
  isGeneratingObservation,
  videoMetadataSummary,
  videoProcessingSummary,
  videoObservationDraft,
  onVideoChange,
  onRemoveVideo,
  onGenerateObservation,
  isBusy,
  observationText,
}) => {
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleVideoChangeInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVideoChange(e);
    // Clear the input value after selection to allow re-uploading the same file
    // if the user removes it and wants to re-upload.
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-indigo-100/30 dark:shadow-none border border-white/50 dark:border-slate-700 transition-all hover:bg-white/80 dark:hover:bg-slate-800/80">
      <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
        <VideoCameraIcon className="w-4 h-4 text-indigo-500" />
        视频观察 (Beta)
      </label>
      <input
        type="file"
        id="video-upload"
        ref={videoInputRef}
        onChange={handleVideoChangeInternal}
        accept="video/*"
        className="hidden"
        disabled={isBusy || !!video}
      />
      {!video ? (
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          disabled={isBusy}
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-700/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
        >
          <VideoCameraIcon className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            点击上传视频片段
          </span>
          <span className="text-xs text-slate-400">支持 MP4, WebM (Max 20MB)</span>
        </button>
      ) : (
        <div className="relative group w-full h-32 bg-black rounded-2xl overflow-hidden">
          <video src={video.url} className="w-full h-full object-contain" controls />
          <button
            type="button"
            onClick={onRemoveVideo}
            className="absolute top-2 right-2 bg-white/80 dark:bg-slate-700/80 text-red-500 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 backdrop-blur-sm"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}
      {video && (
        <>
          {uploadProgress.isUploading && (
            <div className="mt-3">
              <UploadProgressBar progress={uploadProgress.progress} stage={uploadProgress.stage} />
            </div>
          )}
          <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/30 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-slate-600 dark:text-slate-200">视频信息</div>
            <div>{videoMetadataSummary}</div>
            {video.keyframes.length > 0 && <div>已自动截取 {video.keyframes.length} 张关键帧</div>}
            <div className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-2">
              {isGeneratingObservation && <Spinner />}
              <span>{videoProcessingSummary}</span>
            </div>
          </div>
          {videoObservationDraft && (
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-4">
              <div>
                <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  AI 关键瞬间
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {videoObservationDraft.key_moments.map((moment, index) => (
                    <li key={`${moment.timecode}-${index}`}>
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        [{moment.timecode}]
                      </span>{' '}
                      {moment.action}
                      {moment.strategy && (
                        <span className="text-slate-500 dark:text-slate-400">
                          （策略：{moment.strategy}）
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  学习特质
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {videoObservationDraft.learning_traits.map((trait, index) => (
                    <li key={index}>
                      <span className="font-medium">{trait.trait}</span>: {trait.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {video && !observationText.trim() && (
            <button
              type="button"
              onClick={onGenerateObservation}
              disabled={isBusy}
              className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
            >
              {isGeneratingObservation ? (
                <Spinner />
              ) : (
                <SparklesIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              )}
              {isGeneratingObservation ? 'AI 正在观看视频...' : 'AI 生成观察记录'}
            </button>
          )}
        </>
      )}
    </div>
  );
};
