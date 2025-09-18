
import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isAccessible: boolean;
}

interface ContractStepsBarProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

const ContractStepsBar = ({ steps, currentStep, onStepClick }: ContractStepsBarProps) => {
  const completedSteps = steps.filter((_, index) => index <= currentStep && steps[index].isCompleted).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="sticky top-0 z-10 bg-card border-b border-border shadow-lg">
      <div className="w-full py-4 px-6">
        {/* Progress Line */}
        <div className="relative mb-6">
          {/* Background Line */}
          <div className="absolute top-6 left-8 right-8 h-1 bg-muted rounded-full" />
          
          {/* Active Progress Line */}
          <div 
            className="absolute top-6 left-8 h-1 bg-primary rounded-full transition-all duration-500"
            style={{ width: `calc(${progressPercentage}% - 4rem)` }}
          />
          
          {/* Steps */}
          <div className="flex justify-between items-start relative">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = step.isCompleted;
              const isAccessible = step.isAccessible;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  {/* Step Circle */}
                  <button
                    onClick={() => isAccessible && onStepClick(index)}
                    disabled={!isAccessible}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200",
                       isCompleted
                         ? "bg-primary text-primary-foreground"
                         : isActive
                         ? "bg-primary text-primary-foreground"
                         : isAccessible
                         ? "bg-card text-foreground border-2 border-border"
                         : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </button>
                  
                  {/* Step Title */}
                  <div className="mt-3 text-center max-w-[120px]">
                    <p className={cn(
                      "text-sm font-medium",
                       isCompleted
                         ? "text-primary"
                         : isActive
                         ? "text-primary"
                         : isAccessible
                         ? "text-foreground"
                         : "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Progress Summary */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{completedSteps} de {steps.length} concluídas</span>
            <span>•</span>
            <span>{Math.round(progressPercentage)}% completo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractStepsBar;
