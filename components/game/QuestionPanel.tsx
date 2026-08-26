// components/game/QuestionPanel.tsx
import React, { useState } from 'react';
import { Question } from '@/types/game';
import Button from '@/components/ui/Button';

interface QuestionPanelProps {
  question: Question;
  onSubmit: (answer: string) => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({
  question,
  onSubmit,
  isLoading = false,
  isDisabled = false,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  const handleSubmit = () => {
    if (selectedAnswer) {
      onSubmit(selectedAnswer);
      setSelectedAnswer('');
    }
  };

  const options =
    question.questionType === 'multiple_choice'
      ? ['optionA', 'optionB', 'optionC', 'optionD']
      : question.questionType === 'true_false'
      ? ['True', 'False']
      : [];

  return (
    <div className="dungeon-panel p-6">
      <h3 className="dungeon-title text-2xl mb-4">QUESTION</h3>
      <p className="text-dungeon-text mb-6 text-lg">{question.questionText}</p>

      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="Question"
          className="w-full mb-4 max-h-48 object-cover border-2 border-dungeon-border"
        />
      )}

      <div className="space-y-3 mb-6">
        {question.questionType === 'multiple_choice' && (
          <>
            {['A', 'B', 'C', 'D'].map((letter, idx) => {
              const optionKey = `option${letter}` as keyof Question;
              const optionValue = question[optionKey] as string;
              return (
                <button
                  key={letter}
                  onClick={() => setSelectedAnswer(letter)}
                  disabled={isDisabled}
                  className={`w-full p-3 text-left font-bold uppercase border-2 transition-all ${
                    selectedAnswer === letter
                      ? 'bg-dungeon-border text-dungeon-bg border-dungeon-border'
                      : 'bg-dungeon-secondary text-dungeon-text border-dungeon-text-secondary hover:border-dungeon-border'
                  }`}
                >
                  [{letter}] {optionValue}
                </button>
              );
            })}
          </>
        )}

        {question.questionType === 'true_false' && (
          <>
            {['True', 'False'].map((option) => (
              <button
                key={option}
                onClick={() => setSelectedAnswer(option)}
                disabled={isDisabled}
                className={`w-full p-3 font-bold uppercase border-2 transition-all ${
                  selectedAnswer === option
                    ? 'bg-dungeon-border text-dungeon-bg border-dungeon-border'
                    : 'bg-dungeon-secondary text-dungeon-text border-dungeon-text-secondary hover:border-dungeon-border'
                }`}
              >
                {option}
              </button>
            ))}
          </>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!selectedAnswer || isLoading || isDisabled}
        size="lg"
        className="w-full"
      >
        {isLoading ? 'Enviando...' : 'Enviar Respuesta'}
      </Button>
    </div>
  );
};

export default QuestionPanel;
