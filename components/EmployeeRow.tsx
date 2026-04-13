import React from 'react';
import { ProcessedEmployee, FinalFeedback } from '../types';

interface EmployeeRowProps {
  employee: ProcessedEmployee;
  onUpdateEmployee: (employeeId: number, feedbackType: keyof FinalFeedback, value: boolean) => void;
  onUpdateAdditionalBudget: (employeeId: number, value: number) => void;
  onOpenFeedback: (employee: ProcessedEmployee) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

const Checkbox = ({ id, checked, onChange, label }: { id: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label: string }) => (
    <div className="flex items-center justify-center">
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            aria-label={label}
        />
    </div>
);


const EmployeeRow: React.FC<EmployeeRowProps> = ({ employee, onUpdateEmployee, onUpdateAdditionalBudget, onOpenFeedback }) => {
  const { 
    id, 
    finalFeedback, 
    role, 
    keyPersonnelBonus, 
    totalIncreaseAmount, 
    increaseRate, 
    nextYearSalary, 
    departmentRank 
  } = employee;

  const handleCheckboxChange = (feedbackType: keyof FinalFeedback) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if (feedbackType === 'lc' && isChecked && !role.includes('팀장')) {
      // Alert removed as per user request
      return;
    }

    if (feedbackType === 'other' && !isChecked) {
        onUpdateAdditionalBudget(id, 0);
    }

    onUpdateEmployee(id, feedbackType, isChecked);
  };
  
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const numberValue = value === '' ? 0 : parseInt(value.replace(/,/g, ''), 10);
      
      if (isNaN(numberValue)) {
          return;
      }
      
      if (!finalFeedback.other && numberValue > 0) {
        // Alert removed as per user request
      }
      onUpdateAdditionalBudget(id, numberValue);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{employee.organization.team}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{employee.name}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{employee.role}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{employee.years}년</td>
      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
        <button
          onClick={() => onOpenFeedback(employee)}
          className="text-blue-600 hover:text-blue-800 transition-colors duration-150"
        >
          상세보기
        </button>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(employee.currentSalary)}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
        <Checkbox id={`kc-${employee.id}`} checked={employee.finalFeedback.kc} onChange={handleCheckboxChange('kc')} label="Key Contributor"/>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
        <Checkbox id={`cvc-${employee.id}`} checked={employee.finalFeedback.cvc} onChange={handleCheckboxChange('cvc')} label="Core Value Champion"/>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
        <Checkbox id={`lc-${employee.id}`} checked={employee.finalFeedback.lc} onChange={handleCheckboxChange('lc')} label="Leadership Champion"/>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
        <Checkbox id={`other-${employee.id}`} checked={employee.finalFeedback.other} onChange={handleCheckboxChange('other')} label="기타"/>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(keyPersonnelBonus)}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
        <input 
          type="text"
          value={formatCurrency(employee.additionalBudget)}
          onChange={handleBudgetChange}
          className={`w-24 p-2 border border-gray-300 rounded-md text-right focus:ring-blue-500 focus:border-blue-500 ${!finalFeedback.other ? 'bg-gray-100' : ''}`}
          aria-label="담당재량 인상금액"
        />
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(totalIncreaseAmount)}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{increaseRate.toFixed(1)}%</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-700 text-right">{formatCurrency(nextYearSalary)}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{departmentRank}</td>
    </tr>
  );
};

export default EmployeeRow;