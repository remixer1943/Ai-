import React, { useRef } from 'react';

// Icons
const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z"
    />
  </svg>
);

const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

interface ImageData {
  name: string;
  mimeType: string;
  data: string;
}

interface ImageUploadSectionProps {
  images: ImageData[];
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  isBusy: boolean;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  images,
  onImageChange,
  onRemoveImage,
  isBusy,
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChangeInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
    onImageChange(e);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-indigo-100/30 dark:shadow-none border border-white/50 dark:border-slate-700 transition-all hover:bg-white/80 dark:hover:bg-slate-800/80">
      <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
        <ImageIcon className="w-4 h-4 text-indigo-500" />
        图片佐证 (可选)
      </label>
      <input
        type="file"
        id="image-upload"
        ref={imageInputRef}
        onChange={handleImageChangeInternal}
        accept="image/*"
        multiple
        className="hidden"
        disabled={isBusy}
      />
      <button
        type="button"
        onClick={() => imageInputRef.current?.click()}
        disabled={isBusy || images.length >= 5}
        className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-700/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 transition-colors" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          点击上传照片
        </span>
        <span className="text-xs text-slate-400">最多 5 张，每张不超过 10MB</span>
      </button>
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={`data:${img.mimeType};base64,${img.data}`}
                alt={img.name}
                className="w-full h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => onRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-white dark:bg-slate-700 text-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
