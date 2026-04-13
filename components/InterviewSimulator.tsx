
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProcessedEmployee, ChatMessage } from '../types';
// FIX: LiveSession is not an exported member of @google/genai. It has been removed from the import.
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface InterviewSimulatorProps {
    employee: ProcessedEmployee;
    onEndInterview: (history: ChatMessage[]) => void;
    ai: GoogleGenAI;
    onBack: () => void;
}

// FIX: A local type for the live session is defined as it's not exported from the library.
type LiveSession = {
    sendRealtimeInput: (input: { media: { data: string; mimeType: string } }) => void;
    close: () => void;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
};

// Helper functions for audio encoding/decoding
function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const InterviewSimulator: React.FC<InterviewSimulatorProps> = ({ employee, onEndInterview, ai, onBack }) => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const finalFeedbackItems: string[] = [];
    if (employee.finalFeedback.kc) finalFeedbackItems.push('Key Contributor (KC)');
    if (employee.finalFeedback.cvc) finalFeedbackItems.push('Core Value Champion (CVC)');
    if (employee.finalFeedback.lc) finalFeedbackItems.push('Leadership Champion (LC)');
    if (employee.finalFeedback.other) finalFeedbackItems.push('기타');

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

    const stopAudio = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if(mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if(sessionPromiseRef.current) {
           sessionPromiseRef.current.then(session => session.close());
           sessionPromiseRef.current = null;
        }
        setIsListening(false);
    }, []);

    const startAudio = useCallback(async () => {
        if (isListening) return;
        setIsListening(true);
        
        // FIX: Cast window to any to support webkitAudioContext for older browsers without TypeScript errors.
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const outputNode = outputAudioContext.createGain();
        outputNode.connect(outputAudioContext.destination);
        let nextStartTime = 0;

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: async () => {
                    // FIX: Cast window to any to support webkitAudioContext for older browsers without TypeScript errors.
                    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    audioContextRef.current = inputAudioContext;
                    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaStreamSourceRef.current = inputAudioContext.createMediaStreamSource(streamRef.current);
                    scriptProcessorRef.current = inputAudioContext.createScriptProcessor(4096, 1, 1);

                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                        sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContext.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                     if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        setUserInput(prev => prev + text);
                    }
                    if (message.serverContent?.turnComplete) {
                        const fullTranscription = userInput;
                        setUserInput('');
                         if(fullTranscription.trim()){
                             handleSendMessage(fullTranscription.trim());
                         }
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live API Error:', e);
                    stopAudio();
                    setIsVoiceMode(false);
                },
                onclose: (e: CloseEvent) => {
                    console.log('Live API Closed');
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                inputAudioTranscription: {},
            },
        });
    }, [ai, isListening, stopAudio, userInput]);
    
    useEffect(() => {
      return () => stopAudio();
    }, [stopAudio]);

    const handleToggleVoiceMode = async () => {
        if (!isVoiceMode) {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                setIsVoiceMode(true);
                startAudio();
            } catch (err) {
                console.error("마이크 접근 권한이 필요합니다.", err);
                alert("음성 모드를 사용하려면 마이크 접근 권한이 필요합니다.");
            }
        } else {
            setIsVoiceMode(false);
            stopAudio();
        }
    };

    const handleSendMessage = async (messageText: string) => {
        const text = messageText.trim();
        if (!text) return;

        const newHistory: ChatMessage[] = [...history, { role: 'user', text }];
        setHistory(newHistory);
        setUserInput('');
        setIsLoading(true);

        const persona = `
            You are ${employee.name}, a ${employee.role}.
            Your personality: ${employee.personality}
            Your reaction to salary discussions: ${employee.reactionToSalary}
            Your current salary is ${formatCurrency(employee.currentSalary)} and it will be increased to ${formatCurrency(employee.nextYearSalary)}.
            Based on this persona, respond to the user who is your manager (담당님) conducting a performance review. You must address the user as '케클러 담당님'. Keep your responses concise and in character.
            The conversation history is:
            ${newHistory.map(m => `${m.role}: ${m.text}`).join('\n')}
        `;
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ parts: [{ text }] }],
                config: { systemInstruction: persona },
            });
            const modelResponse = response.text;
            setHistory(prev => [...prev, { role: 'model', text: modelResponse }]);
        } catch (error) {
            console.error("Error calling Gemini API", error);
            setHistory(prev => [...prev, { role: 'model', text: "죄송합니다. 응답을 생성하는 중에 오류가 발생했습니다." }]);
        } finally {
            setIsLoading(false);
            if (isVoiceMode) {
                // Restart listening after model responds
                startAudio();
            }
        }
    };

    const handleBack = useCallback(() => {
        stopAudio();
        onBack();
    }, [stopAudio, onBack]);

    return (
        <div className="mt-8 bg-white rounded-xl shadow-lg flex flex-col h-[80vh]">
            {/* Persona Header */}
            <div className="p-4 border-b flex justify-between items-start gap-4">
                <div className="flex-grow">
                    <h2 className="text-xl font-bold">{employee.name}님과의 결과 면담</h2>
                    <p className="text-sm text-gray-500">{employee.role} / {employee.organization.team}</p>
                    <details className="mt-2 text-xs">
                        <summary className="cursor-pointer font-semibold text-blue-600">페르소나 정보 보기</summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded-md space-y-2">
                            <p><strong className="font-medium text-gray-700">성격 및 가치관:</strong> {employee.personality}</p>
                            <p><strong className="font-medium text-gray-700">급여 변동 예상 반응:</strong> {employee.reactionToSalary}</p>
                            <p><strong className="font-medium text-gray-700">급여 변동:</strong> {formatCurrency(employee.currentSalary)} → <span className="font-bold text-blue-700">{formatCurrency(employee.nextYearSalary)}</span> (+{employee.increaseRate.toFixed(1)}%)</p>
                            {finalFeedbackItems.length > 0 && (
                                <p><strong className="font-medium text-gray-700">최종 선정 이력:</strong> {finalFeedbackItems.join(', ')}</p>
                            )}
                        </div>
                    </details>
                    <details className="mt-2 text-xs">
                        <summary className="cursor-pointer font-semibold text-blue-600">피드백 정보 보기</summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded-md space-y-2">
                            <div>
                                <strong className="font-medium text-gray-700">Performance & Growth 1on1 결과:</strong>
                                <p className="mt-1 whitespace-pre-wrap">{employee.feedback.performanceAndGrowth1on1}</p>
                            </div>
                            <div>
                                <strong className="font-medium text-gray-700">HR 리뷰:</strong>
                                <p className="mt-1 whitespace-pre-wrap">{employee.feedback.hrReview}</p>
                            </div>
                            <div>
                                <strong className="font-medium text-gray-700">동료 리뷰:</strong>
                                <p className="mt-1 whitespace-pre-wrap">{employee.feedback.peerReview}</p>
                            </div>
                            <div>
                                <strong className="font-medium text-gray-700">칼리브레이션 기록:</strong>
                                <p className="mt-1 whitespace-pre-wrap">{employee.calibrationRecord || '기록 없음'}</p>
                            </div>
                        </div>
                    </details>
                </div>
                <button
                    onClick={handleBack}
                    className="flex-shrink-0 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    선택 화면으로 돌아가기
                </button>
            </div>

            {/* Chat Area */}
            <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl lg:max-w-2xl px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-800 rounded-lg p-2">
                            <span className="animate-pulse">...생각 중</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t flex items-center gap-2">
                 <button onClick={handleToggleVoiceMode} className={`p-2 rounded-full transition-colors ${isVoiceMode ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isListening ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </button>
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage(userInput)}
                    placeholder={isVoiceMode ? "음성으로 말씀하시거나 여기에 입력하세요..." : "메시지를 입력하세요..."}
                    className="flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
                <button onClick={() => handleSendMessage(userInput)} disabled={isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 disabled:bg-gray-400">
                    전송
                </button>
                 <button onClick={() => onEndInterview(history)} className="bg-gray-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-gray-700">
                    면담 마치기
                </button>
            </div>
        </div>
    );
};

export default InterviewSimulator;
