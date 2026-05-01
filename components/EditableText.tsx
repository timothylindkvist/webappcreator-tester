'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { useEditMode } from './EditModeContext';

interface EditableTextProps {
  path: string;
  value?: string;
  tag?: string;
  className?: string;
  style?: CSSProperties;
}

export default function EditableText({ path, value = '', tag = 'span', className, style }: EditableTextProps) {
  const { isEditMode, overrides, setOverride } = useEditMode();
  const displayValue = path in overrides ? overrides[path] : value;
  const Tag = tag as any;

  // Non-edit mode: plain element
  if (!isEditMode) {
    return <Tag className={className} style={style}>{displayValue}</Tag>;
  }

  // Edit mode: use key to re-mount when AI changes the value, preserving cursor during user typing
  return (
    <Tag
      key={displayValue}
      contentEditable
      suppressContentEditableWarning
      data-editable="true"
      className={className}
      style={{ ...style, outline: 'none', minWidth: '1em', display: tag === 'span' ? 'inline-block' : undefined }}
      dangerouslySetInnerHTML={{ __html: displayValue }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const newValue = e.currentTarget.textContent?.trim() ?? '';
        if (newValue !== displayValue) setOverride(path, newValue);
      }}
    />
  );
}
