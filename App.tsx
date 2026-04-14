
import React, { useState, useMemo, useCallback, useEffect } from 'react';
// FIX: import ProcessedEmployee type to use in state and callbacks
import { Employee, FinalFeedback, ChatMessage, ProcessedEmployee } from './types';
import { initialEmployees, INITIAL_BUDGET } from './data/mockData';
import EmployeeTable from './components/EmployeeTable';
import Header from './components/Header';
import FeedbackModal from './components/FeedbackModal';
import EmployeeSelection from './components/EmployeeSelection';
import InterviewSimulator from './components/InterviewSimulator';
import InterviewFeedback from './components/InterviewFeedback';
import { KC_BONUS, CVC_BONUS, LC_BONUS } from './constants';
import { GoogleGenAI } from '@google/genai';

type View = 'calibration' | 'selection' | 'interview' | 'feedback';

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [view, setView] = useState<View>('calibration');
  // FIX: interviewee should be of type ProcessedEmployee because InterviewSimulator expects it
  const [interviewee, setInterviewee] = useState<ProcessedEmployee | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<ChatMessage[]>([]);
  const [sortedEmployees, setSortedEmployees] = useState<ProcessedEmployee[]>([]);
  console.log('App component mounting...');
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.warn('Warning: API_KEY is missing. AI features will not work.');
  }
  const ai = useMemo(() => new GoogleGenAI({ apiKey: apiKey as string }), [apiKey]);

  const employeesWithDerivedData: ProcessedEmployee[] = useMemo(() => {
    const employeesWithBonuses = employees.map(emp => {
      let keyPersonnelBonus = 0;
      if (emp.finalFeedback.kc) keyPersonnelBonus += KC_BONUS;
      if (emp.finalFeedback.cvc) keyPersonnelBonus += CVC_BONUS;
      if (emp.finalFeedback.lc) keyPersonnelBonus += LC_BONUS;
      const totalIncreaseAmount = keyPersonnelBonus + emp.additionalBudget;
      const increaseRate = emp.currentSalary > 0 ? (totalIncreaseAmount / emp.currentSalary) * 100 : 0;
      const nextYearSalary = emp.currentSalary + totalIncreaseAmount;
      return {
        ...emp,
        keyPersonnelBonus,
        totalIncreaseAmount,
        increaseRate,
        nextYearSalary,
      };
    });

    const salaries = employeesWithBonuses.map(emp => ({
      id: emp.id,
      salary: emp.nextYearSalary,
    })).sort((a, b) => b.salary - a.salary);

    return employeesWithBonuses.map(employee => {
      const rank = salaries.findIndex(s => s.id === employee.id) + 1;
      const percentile = (rank / employees.length) * 100;
      
      let rankString = '상위 100%';
      if (percentile <= 10) rankString = '상위 10%';
      else if (percentile <= 20) rankString = '상위 20%';
      else if (percentile <= 30) rankString = '상위 30%';
      else if (percentile <= 40) rankString = '상위 40%';
      else if (percentile <= 50) rankString = '상위 50%';
      else if (percentile <= 60) rankString = '상위 60%';
      else if (percentile <= 70) rankString = '상위 70%';
      else if (percentile <= 80) rankString = '상위 80%';
      else if (percentile <= 90) rankString = '상위 90%';

      return { ...employee, departmentRank: rankString, departmentRankPercentile: percentile };
    });
  }, [employees]);

  useEffect(() => {
    // If there's no sort order yet, just use the incoming data.
    if (sortedEmployees.length === 0) {
        setSortedEmployees(employeesWithDerivedData);
        return;
    }

    const employeeMap = new Map(employeesWithDerivedData.map(e => [e.id, e]));

    // Update the existing sorted list with new data, preserving order.
    // This handles data changes and deletions.
    const updatedList = sortedEmployees
        .map(oldEmp => employeeMap.get(oldEmp.id))
        .filter((e): e is ProcessedEmployee => e !== undefined);

    // Find any new employees that weren't in the old list and add them to the end.
    const currentIds = new Set(updatedList.map(e => e.id));
    const newEmployees = employeesWithDerivedData.filter(e => !currentIds.has(e.id));

    setSortedEmployees([...updatedList, ...newEmployees]);
  }, [employeesWithDerivedData]);

  const requestSort = useCallback((key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);

    setSortedEmployees(currentEmployees => {
      const sorted = [...currentEmployees];
      const getNestedValue = (obj: any, path: string): any => {
         return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
      };

      sorted.sort((a, b) => {
        const aValue = getNestedValue(a, newSortConfig.key);
        const bValue = getNestedValue(b, newSortConfig.key);

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        if (aValue < bValue) {
          return newSortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return newSortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
      return sorted;
    });
  }, [sortConfig]);

  const totalUsedBudget = useMemo(() => {
    return employees.reduce((total, emp) => {
      let employeeBonus = 0;
      if (emp.finalFeedback.kc) employeeBonus += KC_BONUS;
      if (emp.finalFeedback.cvc) employeeBonus += CVC_BONUS;
      if (emp.finalFeedback.lc) employeeBonus += LC_BONUS;
      return total + employeeBonus + emp.additionalBudget;
    }, 0);
  }, [employees]);

  const remainingBudget = useMemo(() => INITIAL_BUDGET - totalUsedBudget, [totalUsedBudget]);

  const handleUpdateEmployee = useCallback((
    employeeId: number,
    feedbackType: keyof FinalFeedback,
    value: boolean
  ) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId
          ? { ...emp, finalFeedback: { ...emp.finalFeedback, [feedbackType]: value } }
          : emp
      )
    );
  }, []);

  const handleUpdateAdditionalBudget = useCallback((employeeId: number, value: number) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId
          ? { ...emp, additionalBudget: value }
          : emp
      )
    );
  }, []);
  
  const handleUpdateCalibrationRecord = useCallback((employeeId: number, record: string) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId
          ? { ...emp, calibrationRecord: record }
          : emp
      )
    );
  }, []);

  // FIX: employee parameter should be ProcessedEmployee to match what's passed from EmployeeRow
  const handleOpenModal = useCallback((employee: ProcessedEmployee) => {
    setSelectedEmployeeId(employee.id);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedEmployeeId(null);
  }, []);

  const handleConfirmAndStartInterview = useCallback(() => {
    setView('selection');
  }, []);

  // FIX: employee parameter should be ProcessedEmployee and logic can be simplified
  const handleSelectInterviewee = useCallback((employee: ProcessedEmployee) => {
    setInterviewee(employee);
    setView('interview');
  }, []);

  const handleEndInterview = useCallback((history: ChatMessage[]) => {
    setInterviewHistory(history);
    setView('feedback');
  }, []);
  
  const handleCloseFeedback = useCallback(() => {
    setInterviewee(null);
    setInterviewHistory([]);
    setView('selection');
  }, []);

  const handleGoBackToCalibration = useCallback(() => {
    setView('calibration');
  }, []);

  const handleGoBackToSelection = useCallback(() => {
    setInterviewee(null);
    setInterviewHistory([]);
    setView('selection');
  }, []);
  
  const selectedEmployeeForModal = useMemo(
    () => sortedEmployees.find(emp => emp.id === selectedEmployeeId),
    [sortedEmployees, selectedEmployeeId]
  );

  const renderContent = () => {
    switch(view) {
      case 'selection':
        return <EmployeeSelection employees={sortedEmployees} onSelect={handleSelectInterviewee} onBack={handleGoBackToCalibration} />;
      case 'interview':
        if (!interviewee) return null;
        return <InterviewSimulator employee={interviewee} onEndInterview={handleEndInterview} ai={ai} onBack={handleGoBackToSelection} />;
      case 'feedback':
        return <InterviewFeedback history={interviewHistory} onClose={handleCloseFeedback} ai={ai} />;
      case 'calibration':
      default:
        return (
          <main className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
            <EmployeeTable 
              employees={sortedEmployees} 
              onUpdateEmployee={handleUpdateEmployee}
              onUpdateAdditionalBudget={handleUpdateAdditionalBudget}
              onOpenFeedback={handleOpenModal}
              requestSort={requestSort}
              sortConfig={sortConfig}
            />
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="w-full max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">
        <Header 
          totalBudget={INITIAL_BUDGET} 
          remainingBudget={remainingBudget}
          onConfirm={handleConfirmAndStartInterview}
          showConfirm={view === 'calibration'}
        />
        {renderContent()}
      </div>
      {view === 'calibration' && selectedEmployeeForModal && (
        <FeedbackModal 
          employee={selectedEmployeeForModal} 
          onClose={handleCloseModal}
          onUpdateCalibrationRecord={handleUpdateCalibrationRecord}
        />
      )}
    </div>
  );
};

export default App;
