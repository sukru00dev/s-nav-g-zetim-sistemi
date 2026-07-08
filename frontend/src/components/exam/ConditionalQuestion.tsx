import { useState } from 'react';

interface Option {
  id: number;
  text: string;
}

interface ConditionalQuestionProps {
  questionId: number;
  questionText: string;
  options: Option[];
  initialOptionId?: number | null;
  onAnswer: (questionId: number, selectedOptionId: number) => void;
}

export default function ConditionalQuestion({ questionId, questionText, options, initialOptionId, onAnswer }: ConditionalQuestionProps) {
  const [visibleOptions, setVisibleOptions] = useState<Option[]>(() => {
    if (initialOptionId) {
      const idx = options.findIndex(o => o.id === initialOptionId);
      if (idx !== -1) {
        return options.slice(0, idx + 1);
      }
    }
    return [];
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialOptionId) {
      const idx = options.findIndex(o => o.id === initialOptionId);
      return idx !== -1 ? idx + 1 : 0;
    }
    return 0;
  });

  const [hasAnswered, setHasAnswered] = useState(!!initialOptionId);
  const [selectedOption, setSelectedOption] = useState<number | null>(initialOptionId || null);

  const handleRevealNext = () => {
    if (currentIndex < options.length && !hasAnswered) {
      setVisibleOptions(prev => [...prev, options[currentIndex]]);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSelect = (optionId: number) => {
    if (!hasAnswered) {
      setSelectedOption(optionId);
      setHasAnswered(true);
      onAnswer(questionId, optionId);
    }
  };

  return (
    <div className="bg-surface-container-low p-6 rounded-lg shadow-sm border border-outline-variant">
      <div className="mb-4">
        <span className="bg-tertiary text-on-tertiary px-3 py-1 rounded-full text-sm font-bold mb-3 inline-block">Şartlı Uçlu Soru</span>
        <h3 className="text-title-lg font-bold">{questionText}</h3>
        <p className="text-sm text-on-surface-variant mt-2">
          Bu soru tipinde şıkları tek tek açabilirsiniz. Ancak bir şıkkı açtığınızda daha öncekileri veya sonrakileri seçme stratejinizi belirlemelisiniz. 
          Yanıtladığınız an geri dönüş yoktur.
        </p>
      </div>

      <div className="space-y-3 mt-6">
        {visibleOptions.map((opt, index) => {
          const isSkipped = index < visibleOptions.length - 1;
          return (
            <button
              key={opt.id}
              disabled={hasAnswered || isSkipped}
              onClick={() => handleSelect(opt.id)}
              className={`w-full text-left p-4 border rounded-lg transition-all 
                ${selectedOption === opt.id ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-surface-container-high border-outline-variant'}
                ${(hasAnswered || isSkipped) && selectedOption !== opt.id ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
              `}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + index)})</span> {opt.text}
              {isSkipped && <span className="ml-2 text-rose-500 font-bold text-[10px] uppercase tracking-wider">(Pas Geçildi - Geri Dönülemez)</span>}
            </button>
          );
        })}
      </div>

      {currentIndex < options.length && !hasAnswered && (
        <div className="mt-6 flex justify-center">
          <button 
            onClick={handleRevealNext}
            className="bg-secondary text-on-secondary px-6 py-2 rounded-full font-bold shadow hover:bg-secondary-container transition-colors"
          >
            {currentIndex === 0 ? 'İlk Şıkkı Göster' : 'Sonraki Şıkkı Aç'}
          </button>
        </div>
      )}

      {hasAnswered && (
        <div className="mt-6 text-center text-success font-bold">
          Yanıtınız kaydedildi. Bir sonraki soruya geçebilirsiniz.
        </div>
      )}
    </div>
  );
}
