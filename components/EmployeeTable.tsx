import React from 'react';
import { ProcessedEmployee, FinalFeedback } from '../types';
import EmployeeRow from './EmployeeRow';

interface EmployeeTableProps {
  employees: ProcessedEmployee[];
  onUpdateEmployee: (employeeId: number, feedbackType: keyof FinalFeedback, value: boolean) => void;
  onUpdateAdditionalBudget: (employeeId: number, value: number) => void;
  onOpenFeedback: (employee: ProcessedEmployee) => void;
  requestSort: (key: string) => void;
  sortConfig: { key: string; direction: 'ascending' | 'descending' } | null;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, onUpdateEmployee, onUpdateAdditionalBudget, onOpenFeedback, requestSort, sortConfig }) => {
  const headers = [
    { name: '소속', key: 'organization.team', sortable: true },
    { name: '이름', key: 'name', sortable: true },
    { name: '직무', key: 'role', sortable: true },
    { name: '연차', key: 'years', sortable: true },
    { name: '피드백 정보', key: 'feedback', sortable: false },
    { name: '현재 기본급', key: 'currentSalary', sortable: true },
    { name: 'KC', key: 'finalFeedback.kc', sortable: true },
    { name: 'CVC', key: 'finalFeedback.cvc', sortable: true },
    { name: 'LC', key: 'finalFeedback.lc', sortable: true },
    { name: '기타', key: 'finalFeedback.other', sortable: true },
    { name: '핵심인원 선정 인상금액', key: 'keyPersonnelBonus', sortable: true },
    { name: '담당재량 인상금액', key: 'additionalBudget', sortable: true },
    { name: '차년도 기본급 인상금액', key: 'totalIncreaseAmount', sortable: true },
    { name: '인상률(%)', key: 'increaseRate', sortable: true },
    { name: '차년도 기본급', key: 'nextYearSalary', sortable: true },
    { name: '담당내 수준', key: 'departmentRankPercentile', sortable: true }
  ];

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map(header => (
              <th 
                key={header.name} 
                scope="col" 
                className={`px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap ${header.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                onClick={() => header.sortable && requestSort(header.key)}
                aria-sort={sortConfig && sortConfig.key === header.key ? sortConfig.direction : 'none'}
              >
                {header.name}
                <span className="ml-1 text-[10px]">{getSortIndicator(header.key)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map(employee => (
            <EmployeeRow 
              key={employee.id} 
              employee={employee}
              onUpdateEmployee={onUpdateEmployee}
              onUpdateAdditionalBudget={onUpdateAdditionalBudget}
              onOpenFeedback={onOpenFeedback}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;