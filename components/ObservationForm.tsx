import React, { useState, FormEvent, useRef, useEffect, ChangeEvent, useCallback } from 'react';
import DOMPurify, { Config as DOMPurifyConfig } from 'dompurify';
import { useUploadProgress } from '../hooks/useUploadProgress';
import { VideoUploadSection } from './ObservationForm/VideoUploadSection';
import { ImageUploadSection } from './ObservationForm/ImageUploadSection';
import { KnowledgeBaseSection } from './ObservationForm/KnowledgeBaseSection';
import { AgeGroup } from '../types';
import {
  extractEvidence,
  generateObservationFromVideo,
  VideoObservationDraft,
} from '../services/geminiService';
import { Spinner } from './Spinner';

declare const pdfjsLib: any;
declare const mammoth: any;

// Extend the Window interface to include SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface VideoMetadataPayload {
  duration: number;
  width: number;
  height: number;
  size?: number;
  fileName?: string;
}

export interface VideoKeyframePayload {
  mimeType: string;
  data: string;
  timestamp?: number;
}

export interface ObservationFormData {
  observationText: string;
  ageGroup: AgeGroup;
  knowledgeBase?: string;
  keyEvidence?: string[];
  aiInitialEvidence: string[];
  images?: { mimeType: string; data: string }[];
  video?: { mimeType: string; data: string };
  videoMetadata?: VideoMetadataPayload;
  videoKeyframes?: VideoKeyframePayload[];
}

interface ObservationFormProps {
  onSubmit: (data: ObservationFormData) => void;
  isLoading: boolean;
  isResultView: boolean;
  onNewQuery: () => void;
}

const NewQueryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {' '}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />{' '}
  </svg>
);
const FileUploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {' '}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 13.5v-3a3.375 3.375 0 013.375-3.375h3.75m-3.75 0V6a3.375 3.375 0 013.375-3.375h3.75m3.75 0V3.375A3.375 3.375 0 0116.5 0h-3.75m3.75 3.375h3.75a3.375 3.375 0 013.375 3.375v3m-3.75 0h3.75a3.375 3.375 0 013.375 3.375v3.75a3.375 3.375 0 01-3.375 3.375h-3.75m-3.75 0h-3.75a3.375 3.375 0 01-3.375-3.375v-3.75m3.75 0v3.75a3.375 3.375 0 01-3.375-3.375H6.75"
    />{' '}
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
    {' '}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
    />{' '}
  </svg>
);
const CalibrateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
    />
  </svg>
);
const MicrophoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {' '}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
    />{' '}
  </svg>
);
const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {' '}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z"
    />{' '}
  </svg>
);

const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {' '}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
    />{' '}
  </svg>
);

const ageGroupOptions = [
  AgeGroup.AUTO_DETECT,
  AgeGroup.THREE_TO_FOUR,
  AgeGroup.FOUR_TO_FIVE,
  AgeGroup.FIVE_TO_SIX,
];

const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_DURATION_SECONDS = 60;
const KEYFRAME_TARGET_COUNT = 6;

const highlightNarrativeWithEvidence = (narrative: string, evidences: string[]): string => {
  let content = narrative;
  const uniqueEvidence = Array.from(new Set(evidences.filter(Boolean)));
  uniqueEvidence.sort((a, b) => b.length - a.length);
  uniqueEvidence.forEach((phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'g');
    content = content.replace(
      regex,
      `<span class="bg-yellow-200 dark:bg-yellow-800/60 rounded px-1 py-0.5 border-b border-yellow-400">$1</span>`
    );
  });
  return content;
};

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

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64Data = result.split(',')[1];
      if (base64Data) {
        resolve(base64Data);
      } else {
        reject(new Error('无法解析视频文件。'));
      }
    };
    reader.onerror = () => reject(new Error('读取视频文件失败。'));
    reader.readAsDataURL(file);
  });
};

const getVideoMetadata = (
  url: string
): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      cleanup();
      resolve({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('无法读取视频元信息，请更换文件。'));
    };
  });
};

const extractKeyframes = async (
  url: string,
  duration: number,
  frameCount: number = KEYFRAME_TARGET_COUNT
): Promise<VideoKeyframePayload[]> => {
  if (!Number.isFinite(duration) || duration <= 0) {
    return [];
  }
  const capturedFrames: VideoKeyframePayload[] = [];
  try {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.src = url;
    video.muted = true;
    (video as HTMLVideoElement & { playsInline?: boolean }).playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('关键帧提取前无法加载视频。'));
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return [];
    }

    const safeCount = Math.min(frameCount, Math.max(1, Math.ceil(duration)));
    const step = duration / safeCount;

    for (let i = 0; i < safeCount; i++) {
      const targetTime = Math.min(duration, i * step + 0.1);
      // eslint-disable-next-line no-await-in-loop
      await new Promise<void>((resolve, reject) => {
        const handleSeeked = () => {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const [, base64Data] = dataUrl.split(',');
            if (base64Data) {
              capturedFrames.push({
                mimeType: 'image/jpeg',
                data: base64Data,
                timestamp: Number(targetTime.toFixed(2)),
              });
            }
            resolve();
          } catch (err) {
            reject(err instanceof Error ? err : new Error('截帧失败'));
          } finally {
            video.removeEventListener('seeked', handleSeeked);
            video.removeEventListener('error', handleError);
          }
        };
        const handleError = () => {
          video.removeEventListener('seeked', handleSeeked);
          video.removeEventListener('error', handleError);
          reject(new Error('无法在指定时间截帧。'));
        };
        video.addEventListener('seeked', handleSeeked);
        video.addEventListener('error', handleError);
        video.currentTime = targetTime;
      });
    }

    video.pause();
    video.removeAttribute('src');
    video.load();
  } catch (error) {
    console.warn('关键帧提取失败，将继续仅使用原始视频。', error);
    return [];
  }

  return capturedFrames;
};

const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '未知时长';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

export const ObservationForm: React.FC<ObservationFormProps> = ({
  onSubmit,
  isLoading,
  isResultView,
  onNewQuery,
}) => {
  const [observationText, setObservationText] = useState<string>('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(AgeGroup.AUTO_DETECT);
  const [knowledgeFile, setKnowledgeFile] = useState<File | null>(null);
  const [knowledgeFileContent, setKnowledgeFileContent] = useState<string>('');
  const [fileStatus, setFileStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [fileStatusMessage, setFileStatusMessage] = useState<string>('');
  const [isParsingObservation, setIsParsingObservation] = useState(false);

  const [isHighlighting, setIsHighlighting] = useState(false);
  const [isGeneratingObservation, setIsGeneratingObservation] = useState(false);
  const [canCalibrate, setCanCalibrate] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [aiInitialEvidence, setAiInitialEvidence] = useState<string[]>([]);

  const [images, setImages] = useState<{ name: string; mimeType: string; data: string }[]>([]);
  const [video, setVideo] = useState<UploadedVideo | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const uploadProgress = useUploadProgress();
  const [shouldAutoGenerateObservation, setShouldAutoGenerateObservation] = useState(false);
  const [videoStatusMessage, setVideoStatusMessage] = useState('');
  const [videoObservationDraft, setVideoObservationDraft] = useState<VideoObservationDraft | null>(
    null
  );
  const recognitionRef = useRef<any>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const observationFileInputRef = useRef<HTMLInputElement>(null);
  const highlightSanitizeOptions: DOMPurifyConfig = {
    ALLOWED_TAGS: ['span', 'br'],
    ALLOWED_ATTR: ['class'],
  };

  useEffect(() => {
    // Initialize SpeechRecognition if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setObservationText((prev) => {
            const newText = prev + finalTranscript;
            if (editorRef.current) editorRef.current.innerText = newText;
            return newText;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert('请允许访问麦克风以使用语音输入。');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Cleanup video Blob URL on unmount or video change
  useEffect(() => {
    return () => {
      if (video?.url) {
        URL.revokeObjectURL(video.url);
      }
    };
  }, [video?.url]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('您的浏览器不支持语音输入，请尝试使用 Chrome。');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setKnowledgeFile(file);
    setFileStatus('parsing');
    setFileStatusMessage('正在读取文件...');

    try {
      let textContent = '';
      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        setFileStatusMessage('正在解析文本文件...');
        textContent = await file.text();
      } else if (file.type === 'application/pdf') {
        if (typeof pdfjsLib === 'undefined') {
          throw new Error('PDF解析库(pdf.js)加载失败, 请检查网络或刷新页面重试。');
        }
        setFileStatusMessage('正在解析 PDF 文件...');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ');
        }
        textContent = text;
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        if (typeof mammoth === 'undefined') {
          throw new Error('DOCX解析库(mammoth.js)加载失败, 请检查网络或刷新页面重试。');
        }
        setFileStatusMessage('正在解析 DOCX 文件...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        textContent = result.value;
      } else {
        throw new Error('不支持的文件格式。');
      }
      setKnowledgeFileContent(textContent);
      setFileStatus('success');
      setFileStatusMessage('');
    } catch (err) {
      console.error(err);
      setFileStatus('error');
      setFileStatusMessage(err instanceof Error ? err.message : '文件解析失败。');
      setKnowledgeFile(null);
      setKnowledgeFileContent('');
    } finally {
      // Ref clearing handled in sub-component
    }
  };

  const setSanitizedEditorHtml = (html: string) => {
    if (!editorRef.current) return;
    const safeHtml = DOMPurify.sanitize(html, highlightSanitizeOptions);
    editorRef.current.innerHTML = safeHtml;
  };

  const insertPlainTextAtCursor = (text: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editorRef.current?.append(document.createTextNode(text));
      return;
    }
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleEditorPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    if (!text) return;
    if (document.queryCommandSupported('insertText')) {
      document.execCommand('insertText', false, text);
    } else {
      insertPlainTextAtCursor(text);
    }
  };

  const handleObservationFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorRef.current) return;

    setIsParsingObservation(true);
    editorRef.current.innerText = '正在读取文件...';
    editorRef.current.classList.add('italic', 'text-slate-400', 'dark:text-slate-500');

    try {
      let textContent = '';
      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        textContent = await file.text();
      } else if (file.type === 'application/pdf') {
        if (typeof pdfjsLib === 'undefined') {
          throw new Error('PDF解析库(pdf.js)加载失败, 请检查网络或刷新页面重试。');
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ');
        }
        textContent = text;
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        if (typeof mammoth === 'undefined') {
          throw new Error('DOCX解析库(mammoth.js)加载失败, 请检查网络或刷新页面重试。');
        }
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        textContent = result.value;
      } else {
        throw new Error('不支持的文件格式。请上传 .txt, .md, .pdf, 或 .docx 文件。');
      }

      setObservationText(textContent);
      editorRef.current.innerText = textContent;
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '文件解析失败。';
      alert(errorMessage);
      editorRef.current.innerText = observationText;
    } finally {
      setIsParsingObservation(false);
      editorRef.current.classList.remove('italic', 'text-slate-400', 'dark:text-slate-500');
      if (observationFileInputRef.current) {
        observationFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setKnowledgeFile(null);
    setKnowledgeFileContent('');
    setFileStatus('idle');
    setFileStatusMessage('');
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 5) {
      alert('最多只能上传5张图片。');
      return;
    }

    for (const file of Array.from(files) as File[]) {
      if (!file.type.startsWith('image/')) {
        console.warn(`File ${file.name} is not an image and will be skipped.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        const base64Data = result.split(',')[1];
        if (base64Data) {
          setImages((prev) => [
            ...prev,
            {
              name: file.name,
              mimeType: file.type,
              data: base64Data,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('请上传视频文件。');
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      alert('视频文件大小不能超过 20MB。');
      return;
    }

    if (video?.url) {
      URL.revokeObjectURL(video.url);
    }

    const previewUrl = URL.createObjectURL(file);
    uploadProgress.startUpload();
    setVideoStatusMessage('正在读取视频文件...');
    setShouldAutoGenerateObservation(false);
    setVideoObservationDraft(null);

    try {
      const metadata = await getVideoMetadata(previewUrl);
      if (metadata.duration > MAX_VIDEO_DURATION_SECONDS) {
        URL.revokeObjectURL(previewUrl);
        alert(`视频时长不得超过 ${MAX_VIDEO_DURATION_SECONDS} 秒，请裁剪后重新上传。`);
        return;
      }

      const [base64Data, keyframes] = await Promise.all([
        readFileAsBase64(file),
        extractKeyframes(previewUrl, metadata.duration),
      ]);

      setVideo({
        name: file.name,
        mimeType: file.type,
        data: base64Data,
        url: previewUrl,
        size: file.size,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        keyframes,
      });
      setVideoStatusMessage('AI 正在准备视频...');
      setShouldAutoGenerateObservation(true);
    } catch (error) {
      console.error('处理视频文件失败', error);
      URL.revokeObjectURL(previewUrl);
      setVideo(null);
      setVideoStatusMessage('');
      setShouldAutoGenerateObservation(false);
      setVideoObservationDraft(null);
      alert(error instanceof Error ? error.message : '处理视频文件失败，请重试。');
    } finally {
      uploadProgress.failUpload('处理视频文件失败');
    }
  };

  const handleRemoveVideo = () => {
    if (video?.url) {
      URL.revokeObjectURL(video.url);
    }
    setVideo(null);
    setVideoStatusMessage('');
    setShouldAutoGenerateObservation(false);
    uploadProgress.resetProgress();
    setVideoObservationDraft(null);
  };

  const handleGenerateObservation = useCallback(
    async (origin: 'auto' | 'manual' = 'manual') => {
      if (!video) return;

      setIsGeneratingObservation(true);
      setVideoStatusMessage(origin === 'auto' ? 'AI 正在解析视频...' : '正在重新生成观察记录...');
      try {
        const draft = await generateObservationFromVideo(
          { mimeType: video.mimeType, data: video.data },
          {
            metadata: {
              duration: video.duration,
              width: video.width,
              height: video.height,
              size: video.size,
              fileName: video.name,
            },
            keyframes: video.keyframes,
          }
        );
        const evidencePhrases = [
          ...draft.key_moments.map((m) => m.evidence),
          ...draft.learning_traits.map((t) => t.evidence),
        ];
        const highlightedNarrative = highlightNarrativeWithEvidence(
          draft.narrative,
          evidencePhrases
        );
        setVideoObservationDraft(draft);
        setObservationText(draft.narrative);
        if (editorRef.current) {
          setSanitizedEditorHtml(highlightedNarrative);
        }
        setVideoStatusMessage('AI 已生成结构化观察草稿，可继续编辑或提交。');
      } catch (error) {
        console.error('Failed to generate observation:', error);
        alert(`生成观察记录失败：${error instanceof Error ? error.message : '未知错误'}`);
        setVideoObservationDraft(null);
        setVideoStatusMessage('');
      } finally {
        setIsGeneratingObservation(false);
        setShouldAutoGenerateObservation(false);
      }
    },
    [video]
  );

  useEffect(() => {
    if (!shouldAutoGenerateObservation || !video || isGeneratingObservation) return;
    handleGenerateObservation('auto');
  }, [shouldAutoGenerateObservation, video, isGeneratingObservation, handleGenerateObservation]);

  const handleExtractEvidence = async () => {
    if (!editorRef.current || !observationText.trim()) return;

    setIsHighlighting(true);
    setCanCalibrate(false);
    setIsCalibrating(false);
    setAiInitialEvidence([]);
    try {
      const plainText = editorRef.current.innerText;
      setObservationText(plainText); // Sync state before extraction

      const evidencePhrases = await extractEvidence(plainText);
      setAiInitialEvidence(evidencePhrases); // Save AI's initial guess for logging

      let content = plainText;
      const uniquePhrases = [...new Set(evidencePhrases)];
      uniquePhrases.sort((a, b) => b.length - a.length);

      uniquePhrases.forEach((phrase) => {
        const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedPhrase})`, 'g');
        content = content.replace(
          regex,
          `<span class="bg-yellow-200 dark:bg-yellow-800/60 rounded px-1 py-0.5 cursor-pointer border-b border-yellow-400">${'$1'}</span>`
        );
      });
      setSanitizedEditorHtml(content);
      setCanCalibrate(true);
    } catch (error) {
      console.error('Failed to extract evidence', error);
      alert(`提取证据失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsHighlighting(false);
    }
  };

  const handleStartCalibration = () => {
    setIsCalibrating(true);
    setCanCalibrate(false);
  };

  const handleAddHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className =
      'bg-yellow-200 dark:bg-yellow-800/60 rounded px-1 py-0.5 cursor-pointer border-b border-yellow-400';
    try {
      range.surroundContents(span);
    } catch (e) {
      console.warn('Could not wrap the current selection.', e);
    } finally {
      selection.removeAllRanges();
    }
  };

  const handleRemoveHighlight = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCalibrating) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'SPAN' && target.className.includes('bg-yellow-200')) {
      const parent = target.parentNode;
      if (parent) {
        while (target.firstChild) {
          parent.insertBefore(target.firstChild, target);
        }
        parent.removeChild(target);
        parent.normalize();
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const currentText = editorRef.current?.innerText || '';
    setObservationText(currentText);

    const finalEvidence: string[] = [];
    if (editorRef.current) {
      const highlightedSpans = editorRef.current.querySelectorAll('span.bg-yellow-200');
      highlightedSpans.forEach((span) => {
        finalEvidence.push((span as HTMLElement).innerText);
      });
    }

    onSubmit({
      observationText: currentText,
      ageGroup,
      knowledgeBase: knowledgeFileContent,
      keyEvidence: finalEvidence,
      aiInitialEvidence,
      images:
        images.length > 0
          ? images.map((img) => ({ mimeType: img.mimeType, data: img.data }))
          : undefined,
      video: video ? { mimeType: video.mimeType, data: video.data } : undefined,
      videoMetadata: video
        ? {
            duration: video.duration,
            width: video.width,
            height: video.height,
            size: video.size,
            fileName: video.name,
          }
        : undefined,
      videoKeyframes:
        video && video.keyframes.length > 0
          ? video.keyframes.map((frame) => ({ ...frame }))
          : undefined,
    });
  };

  const handleNewQueryInternal = () => {
    setObservationText('');
    setAgeGroup(AgeGroup.AUTO_DETECT);
    setKnowledgeFile(null);
    setKnowledgeFileContent('');
    setFileStatus('idle');
    setFileStatusMessage('');
    // Refs cleared in sub-components
    if (observationFileInputRef.current) {
      observationFileInputRef.current.value = '';
    }
    setImages([]);
    if (video?.url) {
      URL.revokeObjectURL(video.url);
    }
    setVideo(null);
    setVideoStatusMessage('');
    uploadProgress.resetProgress();
    setShouldAutoGenerateObservation(false);
    setVideoObservationDraft(null);
    setIsHighlighting(false);
    setCanCalibrate(false);
    setIsCalibrating(false);
    setAiInitialEvidence([]);

    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }

    onNewQuery();
  };

  const isParsing = fileStatus === 'parsing';
  const isBusy =
    isLoading ||
    isParsing ||
    isHighlighting ||
    isParsingObservation ||
    isGeneratingObservation ||
    uploadProgress.isUploading;
  const videoMetadataSummary = video
    ? `${formatDuration(video.duration)} · ${video.width}×${video.height} · ${(video.size / (1024 * 1024)).toFixed(1)} MB`
    : '';
  const videoProcessingSummary = video
    ? uploadProgress.isUploading
      ? '正在解析视频...'
      : isGeneratingObservation
        ? 'AI 正在撰写观察记录...'
        : videoStatusMessage ||
          (videoObservationDraft ? 'AI 已生成结构化草稿。' : '视频已就绪，可生成 AI 草稿。')
    : '';

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-6 animate-fade-in font-['Noto_Sans_SC']"
    >
      <input
        type="file"
        id="observation-file-upload"
        ref={observationFileInputRef}
        onChange={handleObservationFileChange}
        accept=".txt,.md,.pdf,.docx"
        className="hidden"
        disabled={isBusy}
      />
      {isResultView && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            分析报告
          </h2>
          <button
            onClick={handleNewQueryInternal}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
          >
            <NewQueryIcon className="w-5 h-5" />
            开启新观察
          </button>
        </div>
      )}

      <div
        className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-100/50 dark:shadow-none border border-white/50 dark:border-slate-700 overflow-hidden transition-all duration-300 ${isResultView ? 'opacity-90 grayscale-[30%]' : 'hover:shadow-2xl hover:shadow-indigo-200/50 dark:hover:shadow-none'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/60">
          <label className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wide">
            {isResultView ? '📄 原始观察 (Archived)' : '📝 观察记录 (Observation)'}
          </label>
          {!isResultView && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => observationFileInputRef.current?.click()}
                disabled={isBusy}
                className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center gap-1"
              >
                <FileUploadIcon className="w-3 h-3" />
                导入文件
              </button>
            </div>
          )}
        </div>
        <div className="relative group">
          <div
            id="observation"
            ref={editorRef}
            contentEditable={!isBusy && !isResultView}
            onInput={(e) => {
              if (isResultView) return;
              setObservationText(e.currentTarget.innerText);
              if (canCalibrate || isCalibrating) {
                e.currentTarget.innerHTML = e.currentTarget.innerText;
              }
              setCanCalibrate(false);
              setIsCalibrating(false);
            }}
            onPaste={handleEditorPaste}
            onClick={handleRemoveHighlight}
            data-placeholder="请在此输入或语音口述幼儿观察记录..."
            className={`w-full min-h-[240px] p-6 bg-transparent text-slate-700 dark:text-slate-200 outline-none text-lg leading-relaxed transition-colors overflow-auto prose prose-slate dark:prose-invert max-w-none 
            [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-slate-400 [&:empty]:before:dark:text-slate-500
            ${isResultView ? 'cursor-default' : 'cursor-text'}`}
          />
          {!isResultView && (
            <div className="absolute bottom-6 right-6 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 transform hover:scale-110 ${
                  isRecording
                    ? 'bg-rose-500 text-white ring-4 ring-rose-200 dark:ring-rose-900/50 animate-pulse'
                    : 'bg-white/90 dark:bg-slate-700/90 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-600 border border-slate-100 dark:border-slate-600'
                }`}
                title={isRecording ? '停止录音' : '点击开始语音输入'}
              >
                {isRecording ? (
                  <StopIcon className="w-6 h-6" />
                ) : (
                  <MicrophoneIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          )}
        </div>

        {!isResultView && (
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap justify-end gap-3 backdrop-blur-md">
            {isCalibrating ? (
              <div className="flex-1 flex items-center justify-between mr-4 animate-fade-in bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  🎯 校准模式：请点击文字添加或取消高亮
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddHighlight}
                    className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-600 rounded-lg text-indigo-700 dark:text-indigo-300 hover:shadow-sm font-semibold"
                  >
                    手动高亮
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalibrating(false)}
                    className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm font-semibold"
                  >
                    完成校准
                  </button>
                </div>
              </div>
            ) : (
              <>
                {canCalibrate && (
                  <button
                    type="button"
                    onClick={handleStartCalibration}
                    disabled={isBusy}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors animate-fade-in"
                  >
                    <CalibrateIcon className="w-4 h-4" />
                    校准证据
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExtractEvidence}
                  disabled={isBusy || !observationText.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-amber-200/50 dark:border-amber-800/50"
                >
                  {isHighlighting ? <Spinner /> : <SparklesIcon className="w-4 h-4" />}
                  AI 提取证据
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!isResultView && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Upload Card */}
            <ImageUploadSection
              images={images}
              onImageChange={handleImageChange}
              onRemoveImage={handleRemoveImage}
              isBusy={isBusy}
            />

            <VideoUploadSection
              video={video}
              uploadProgress={uploadProgress}
              isGeneratingObservation={isGeneratingObservation}
              videoMetadataSummary={videoMetadataSummary}
              videoProcessingSummary={videoProcessingSummary}
              videoObservationDraft={videoObservationDraft}
              onVideoChange={handleVideoChange}
              onRemoveVideo={handleRemoveVideo}
              onGenerateObservation={() => handleGenerateObservation('auto')}
              isBusy={isBusy}
              observationText={observationText}
            />

            <KnowledgeBaseSection
              knowledgeFile={knowledgeFile}
              fileStatus={fileStatus}
              fileStatusMessage={fileStatusMessage}
              onKnowledgeFileChange={handleFileChange}
              onRemoveKnowledgeFile={handleRemoveFile}
              isBusy={isBusy}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-8 mt-2">
            <div className="flex-1">
              <label
                htmlFor="ageGroup"
                className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 ml-1"
              >
                目标年龄段
              </label>
              <div className="relative">
                <select
                  id="ageGroup"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                  className="w-full sm:w-64 p-3.5 pl-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm transition-all text-sm font-bold text-slate-700 dark:text-slate-200 appearance-none cursor-pointer hover:border-indigo-300"
                  disabled={isBusy}
                >
                  {ageGroupOptions.map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a.75.75 0 0 1 .55.24l3.25 3.5a.75.75 0 1 1-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 0 1-1.1-1.02l3.25-3.5A.75.75 0 0 1 10 3Zm-3.76 9.2a.75.75 0 0 1 1.06.04l2.7 2.908 2.7-2.908a.75.75 0 1 1 1.1 1.02l-3.25 3.5a.75.75 0 0 1-1.1 0l-3.25-3.5a.75.75 0 0 1 .04-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={isBusy || (!observationText.trim() && images.length === 0 && !video)}
              className="group relative w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden ring-1 ring-white/20"
            >
              <span className="relative z-10 flex items-center justify-center gap-3 text-base">
                {isLoading
                  ? '深度思考中...'
                  : isParsing
                    ? '文件处理中...'
                    : isHighlighting
                      ? '提取证据中...'
                      : '开始智能分析'}
                {!isBusy && (
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            </button>
          </div>
        </>
      )}
    </form>
  );
};
