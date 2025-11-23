
import React, { useState, useEffect } from 'react';

export interface ApiSettings {
    provider: 'gemini' | 'doubao' | 'siliconflow';
    doubaoApiKey?: string;
    doubaoModelEndpoint?: string;
    siliconApiKey?: string;
    siliconModel?: string;
    siliconBaseUrl?: string;
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: ApiSettings) => void;
    currentSettings: ApiSettings;
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
    const [settings, setSettings] = useState<ApiSettings>(currentSettings);

    useEffect(() => {
        setSettings(currentSettings);
    }, [currentSettings, isOpen]);

    const handleSave = () => {
        onSave(settings);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 id="settings-modal-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        模型设置
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Close settings"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                            AI 服务提供商
                        </label>
                        <div className="flex gap-2">
                            {['gemini', 'doubao', 'siliconflow'].map((provider) => (
                                <button
                                    key={provider}
                                    onClick={() => setSettings(s => ({ ...s, provider: provider as 'gemini' | 'doubao' | 'siliconflow' }))}
                                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                        settings.provider === provider
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {provider === 'gemini' ? 'Gemini' : provider === 'doubao' ? '豆包 (Doubao)' : '硅基流动'}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {settings.provider === 'doubao' && (
                        <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg animate-fade-in">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">豆包模型配置</h3>
                             <div>
                                <label htmlFor="doubaoApiKey" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                                    API Key
                                </label>
                                <input
                                    id="doubaoApiKey"
                                    type="password"
                                    value={settings.doubaoApiKey || ''}
                                    onChange={(e) => setSettings(s => ({ ...s, doubaoApiKey: e.target.value }))}
                                    className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="请输入您的豆包 API Key"
                                />
                            </div>
                             <div>
                                <label htmlFor="doubaoModelEndpoint" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                                    Model Endpoint
                                </label>
                                <input
                                    id="doubaoModelEndpoint"
                                    type="text"
                                    value={settings.doubaoModelEndpoint || ''}
                                    onChange={(e) => setSettings(s => ({ ...s, doubaoModelEndpoint: e.target.value }))}
                                    className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="例如: ep-20240618115325-xxxxx"
                                />
                            </div>
                        </div>
                    )}

                    {settings.provider === 'siliconflow' && (
                        <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg animate-fade-in">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">硅基流动配置</h3>
                            <div>
                                <label htmlFor="siliconApiKey" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                                    API Key
                                </label>
                                <input
                                    id="siliconApiKey"
                                    type="password"
                                    value={settings.siliconApiKey || ''}
                                    onChange={(e) => setSettings(s => ({ ...s, siliconApiKey: e.target.value }))}
                                    className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="请输入硅基流动 API Key"
                                />
                            </div>
                            <div>
                                <label htmlFor="siliconModel" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                                    模型名称
                                </label>
                                <input
                                    id="siliconModel"
                                    type="text"
                                    value={settings.siliconModel || ''}
                                    onChange={(e) => setSettings(s => ({ ...s, siliconModel: e.target.value }))}
                                    className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="例如: siliconflow-chat"
                                />
                            </div>
                            <div>
                                <label htmlFor="siliconBaseUrl" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                                    API Endpoint (可选)
                                </label>
                                <input
                                    id="siliconBaseUrl"
                                    type="text"
                                    value={settings.siliconBaseUrl || ''}
                                    onChange={(e) => setSettings(s => ({ ...s, siliconBaseUrl: e.target.value }))}
                                    className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="默认: https://api.siliconflow.cn/v1/chat/completions"
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-xl">
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-colors"
                    >
                        保存设置
                    </button>
                </div>
            </div>
        </div>
    );
};
