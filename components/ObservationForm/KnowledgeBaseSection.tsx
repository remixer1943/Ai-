import React, { useRef } from 'react';
import { Spinner } from '../Spinner';

// Icons
const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
    />
  </svg>
);

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

interface KnowledgeBaseSectionProps {
  knowledgeFile: File | null;
  fileStatus: 'idle' | 'parsing' | 'success' | 'error';
  fileStatusMessage: string;
  onKnowledgeFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveKnowledgeFile: () => void;
  isBusy: boolean;
}

export const KnowledgeBaseSection: React.FC<KnowledgeBaseSectionProps> = ({
  knowledgeFile,
  fileStatus,
  fileStatusMessage,
  onKnowledgeFileChange,
  onRemoveKnowledgeFile,
  isBusy,
}) => {
  const knowledgeFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChangeInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
    onKnowledgeFileChange(e);
    if (knowledgeFileInputRef.current) {
      knowledgeFileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-indigo-100/30 dark:shadow-none border border-white/50 dark:border-slate-700 transition-all hover:bg-white/80 dark:hover:bg-slate-800/80">
      <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
        <DocumentTextIcon className="w-4 h-4 text-indigo-500" />
        自定义知识库 (可选)
      </label>
      <input
        type="file"
        id="knowledge-file-upload"
        ref={knowledgeFileInputRef}
        onChange={handleFileChangeInternal}
        accept=".pdf,.docx"
        className="hidden"
        disabled={isBusy || !!knowledgeFile}
      />
      {!knowledgeFile ? (
        <button
          type="button"
          onClick={() => knowledgeFileInputRef.current?.click()}
          disabled={isBusy}
          className="w-full h-20 flex flex-col items-center justify-center gap-1 px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
        >
          <DocumentTextIcon className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            点击上传 .pdf / .docx
          </span>
          <span className="text-xs text-slate-400">支持园本课程或特殊评估标准</span>
        </button>
      ) : (
        <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
          <div className="text-sm overflow-hidden mr-2">
            <p className="font-bold text-indigo-900 dark:text-indigo-200 truncate">
              {knowledgeFile.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {fileStatus === 'parsing' && <Spinner />}
              {fileStatus === 'success' && (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">已就绪</span>
                </div>
              )}
              {fileStatus === 'error' && (
                <p className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded">
                  {fileStatusMessage}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onRemoveKnowledgeFile}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
