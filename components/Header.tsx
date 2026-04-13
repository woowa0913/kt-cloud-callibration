
import React from 'react';

interface HeaderProps {
  totalBudget: number;
  remainingBudget: number;
  onConfirm: () => void;
  showConfirm: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

const Header: React.FC<HeaderProps> = ({ totalBudget, remainingBudget, onConfirm, showConfirm }) => {
  const budgetUsagePercentage = totalBudget > 0 ? ((totalBudget - remainingBudget) / totalBudget) * 100 : 0;
  const isBudgetExhausted = remainingBudget <= 0;
  const isOverBudget = remainingBudget < 0;

  return (
    <header className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">kt cloud 칼리브레이션 & 면담 시뮬레이터</h1>
          <p className="text-sm text-gray-500 mt-1">플랫폼개발담당</p>
        </div>
        <div className="flex items-center mt-4 sm:mt-0">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">전체 재원 현황</p>
            <p className={`text-2xl font-bold ${isBudgetExhausted ? 'text-red-600' : 'text-blue-600'}`}>
              {formatCurrency(remainingBudget)}
            </p>
            <p className="text-xs text-gray-400">총 재원: {formatCurrency(totalBudget)}</p>
          </div>
          {showConfirm && (
            <div className="ml-6">
              <button
                onClick={onConfirm}
                disabled={isOverBudget}
                title={isOverBudget ? "재원을 초과하여 확정할 수 없습니다." : ""}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                확정하고 면담 시작하기
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`${isBudgetExhausted ? 'bg-red-600' : 'bg-blue-600'} h-2.5 rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(budgetUsagePercentage, 100)}%` }}
          ></div>
        </div>
      </div>
    </header>
  );
};

export default Header;
