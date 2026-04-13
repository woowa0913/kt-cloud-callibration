
import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../types';
import { GoogleGenAI } from '@google/genai';

interface InterviewFeedbackProps {
    history: ChatMessage[];
    onClose: () => void;
    ai: GoogleGenAI;
}

const InterviewFeedback: React.FC<InterviewFeedbackProps> = ({ history, onClose, ai }) => {
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getFeedback = async () => {
            const transcript = history.map(msg => `${msg.role === 'user' ? '면담자' : '구성원'}: ${msg.text}`).join('\n');
            
            const prompt = `
                다음은 HR 결과 면담 대화록입니다. 이 대화록을 바탕으로, 면담자(manager)의 커뮤니케이션 스킬에 대해 전문적인 피드백을 제공해주세요. 
                피드백은 다음 항목을 포함하여 구체적이고 건설적인 내용으로 작성해주세요.
                
                1.  **잘한 점 (Good Points):** 긍정적인 커뮤니케이션 방식, 효과적인 질문, 공감 능력 등 칭찬할 점을 구체적인 예시와 함께 설명해주세요.
                2.  **개선할 점 (Areas for Improvement):** 오해를 살 수 있는 표현, 부족했던 질문, 더 나은 접근 방식 등을 구체적인 대안과 함께 제시해주세요.
                3.  **총평 (Overall Summary):** 면담의 전반적인 분위기와 목표 달성 여부를 요약하고, 성공적인 결과 면담을 위한 핵심 팁을 1~2가지 제안해주세요.
                
                피드백은 한국어로, 전문가적인 톤으로 작성해주세요.

                ---
                [면담 대화록]
                ${transcript}
                ---
            `;

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: [{ parts: [{ text: prompt }] }],
                });
                setFeedback(response.text);
            } catch (error) {
                console.error("Error getting feedback:", error);
                setFeedback("피드백을 생성하는 중 오류가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        getFeedback();
    }, [history, ai]);

    const formatFeedback = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert markdown bold to strong tag
            .replace(/\n/g, '<br />'); // Convert newlines to br tags
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">결과 면담 피드백</h2>
                    <p className="text-sm text-gray-500">AI가 생성한 면담 스킬 피드백입니다.</p>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="mt-4 text-gray-600">피드백을 생성하고 있습니다...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: formatFeedback(feedback) }} />
                    )}
                </div>
                <div className="p-4 bg-gray-50 rounded-b-xl text-right">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterviewFeedback;
