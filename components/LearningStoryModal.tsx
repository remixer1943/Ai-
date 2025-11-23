
import React from 'react';

interface LearningStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    isLoading: boolean;
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
);

export const LearningStoryModal: React.FC<LearningStoryModalProps> = ({ isOpen, onClose, content, isLoading }) => {
    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        alert("内容已复制到剪贴板");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div 
                className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] border border-stone-200 dark:border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">💌</span>
                        <div>
                            <h2 className="text-lg font-bold text-stone-800 dark:text-slate-100 font-['Noto_Sans_SC']">学习故事</h2>
                            <p className="text-[10px] text-stone-400 dark:text-slate-500 uppercase tracking-wider font-bold">Learning Story</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-10 bg-[#fcfbf9] dark:bg-slate-900 scroll-smooth">
                    {isLoading ? (
                        <div className="space-y-6 animate-pulse max-w-lg mx-auto mt-4">
                            <div className="h-8 bg-stone-200 dark:bg-slate-800 rounded w-2/3 mx-auto mb-10"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-stone-100 dark:bg-slate-800 rounded w-full"></div>
                                <div className="h-4 bg-stone-100 dark:bg-slate-800 rounded w-full"></div>
                                <div className="h-4 bg-stone-100 dark:bg-slate-800 rounded w-5/6"></div>
                            </div>
                            <div className="space-y-3 pt-6">
                                <div className="h-4 bg-stone-100 dark:bg-slate-800 rounded w-full"></div>
                                <div className="h-4 bg-stone-100 dark:bg-slate-800 rounded w-4/5"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-none font-serif">
                            {/* Render simple text with whitespace preservation. Large readable font. */}
                            <div className="whitespace-pre-wrap text-stone-700 dark:text-slate-300 text-lg sm:text-xl leading-loose tracking-wide">
                                {content}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-6 py-4 bg-white dark:bg-slate-900 border-t border-stone-100 dark:border-slate-800 rounded-b-2xl">
                    <p className="text-xs text-stone-400 dark:text-slate-600 italic">
                        * 该内容由 AI 生成，仅供参考，建议您根据实际情况润色。
                    </p>
                    <button
                        onClick={handleCopy}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        <CopyIcon className="w-4 h-4" />
                        复制全文
                    </button>
                </div>
            </div>
        </div>
    );
};
