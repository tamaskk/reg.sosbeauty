import { useState } from 'react';

interface InfoBoxProps {
  label: string;
  value: string | string[] | null | undefined;
  type?: 'text' | 'list' | 'address' | 'contact';
  onCopy?: (value: string) => void;
}

export default function ProviderInfoBox({ label, value, type = 'text', onCopy }: InfoBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    let textToCopy = '';
    
    if (Array.isArray(value)) {
      textToCopy = value.join('\n');
    } else if (value) {
      textToCopy = value;
    } else {
      textToCopy = 'N/A';
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onCopy) {
        onCopy(textToCopy);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatValue = () => {
    if (!value) return 'N/A';
    if (Array.isArray(value)) {
      return value.map((item, index) => (
        <div key={index} className="mb-1 last:mb-0">
          {item}
        </div>
      ));
    }
    return value;
  };

  return (
    <div 
      className={`relative p-4 rounded-lg border ${
        onCopy ? 'cursor-pointer hover:bg-gray-50' : ''
      } ${copied ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
      onClick={handleCopy}
      title="Kattintson a másoláshoz"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        <span className={`text-xs ${copied ? 'text-green-500' : 'text-gray-400'}`}>
          {copied ? 'Másolva!' : 'Kattintson a másoláshoz'}
        </span>
      </div>
      <div className="text-gray-900 break-words">
        {formatValue()}
      </div>
      {copied && (
        <div className="absolute top-2 right-2 text-xs text-green-600">
          Másolva!
        </div>
      )}
    </div>
  );
} 