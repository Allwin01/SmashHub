import * as React from 'react';

interface RadioGroupProps {
  children: React.ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

export const RadioGroup = ({ children, className, onValueChange, defaultValue }: RadioGroupProps) => {
  const [selected, setSelected] = React.useState(defaultValue || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(e.target.value);
    onValueChange?.(e.target.value);
  };

  return (
    <div className={`flex gap-4 ${className}`}>
      {React.Children.map(children, (child: any) =>
        React.cloneElement(child, {
          checked: child.props.value === selected,
          onChange: handleChange,
        })
      )}
    </div>
  );
};

interface RadioGroupItemProps {
  id: string;
  value: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RadioGroupItem = ({ id, value, checked, onChange }: RadioGroupItemProps) => (
  <div className="flex items-center gap-2">
    <input
      type="radio"
      id={id}
      name={id.split('-')[0]} // Group by player ID
      value={value}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4"
    />
  </div>
);
