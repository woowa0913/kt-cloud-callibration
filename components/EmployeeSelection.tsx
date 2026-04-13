
import React from 'react';
import { ProcessedEmployee } from '../types';

interface EmployeeSelectionProps {
    employees: ProcessedEmployee[];
    onSelect: (employee: ProcessedEmployee) => void;
    onBack: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
};

const EmployeeSelection: React.FC<EmployeeSelectionProps> = ({ employees, onSelect, onBack }) => {
    return (
        <div className="mt-8">
            <div className="relative text-center mb-8">
                <button
                    onClick={onBack}
                    className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    칼리브레이션으로 돌아가기
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">면담 대상자 선택</h2>
                    <p className="text-gray-500 mt-1">결과 면담을 진행할 구성원을 선택해주세요.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {employees.map(employee => (
                    <div key={employee.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-gray-900">{employee.name}</h3>
                                <span className="text-sm font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">{employee.organization.team}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{employee.role}</p>
                            <div className="mt-4 border-t pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">현재 기본급:</span>
                                    <span className="font-medium text-gray-800">{formatCurrency(employee.currentSalary)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">인상 금액:</span>
                                    <span className="font-medium text-blue-600">+{formatCurrency(employee.totalIncreaseAmount)} ({employee.increaseRate.toFixed(1)}%)</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">차년도 기본급:</span>
                                    <span className="font-bold text-blue-700">{formatCurrency(employee.nextYearSalary)}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => onSelect(employee)}
                            className="mt-6 w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            면담 시작하기
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmployeeSelection;
