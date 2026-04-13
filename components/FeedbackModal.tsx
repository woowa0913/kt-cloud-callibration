
import React from 'react';
import { Employee, ProcessedEmployee } from '../types';

interface FeedbackModalProps {
  employee: Employee | ProcessedEmployee;
  onClose: () => void;
  onUpdateCalibrationRecord: (employeeId: number, record: string) => void;
}

const FeedbackSection: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div>
    <h4 className="text-md font-semibold text-gray-700">{title}</h4>
    <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{content}</p>
  </div>
);

const FeedbackModal: React.FC<FeedbackModalProps> = ({ employee, onClose, onUpdateCalibrationRecord }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{employee.name}</h3>
              <p className="text-sm text-gray-500">{employee.role} / {employee.organization.team}</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <FeedbackSection title="Performance & Growth 1on1 결과" content={employee.feedback.performanceAndGrowth1on1} />
          <FeedbackSection title="HR 리뷰" content={employee.feedback.hrReview} />
          <FeedbackSection title="리더 리뷰" content={employee.feedback.leaderReview} />
          <FeedbackSection title="셀프리뷰" content={employee.feedback.selfReview} />
          <FeedbackSection title="동료 리뷰" content={employee.feedback.peerReview} />
          <div>
            <h4 className="text-md font-semibold text-gray-700">칼리브레이션 기록</h4>
            <textarea
              className="mt-1 w-full text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={4}
              placeholder="칼리브레이션 관련 논의 내용이나 조정 사유를 기록해주세요."
              value={employee.calibrationRecord}
              onChange={(e) => onUpdateCalibrationRecord(employee.id, e.target.value)}
            />
            <p className="mt-2 text-xs text-blue-600">
              본 시스템은 저장 기능이 없기에 전체 시스템 화면을 닫으시거나 새로고침을 하시면 내용은 삭제 됩니다.
            </p>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg text-right">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                닫기
            </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
