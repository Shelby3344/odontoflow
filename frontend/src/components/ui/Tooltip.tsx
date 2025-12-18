import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 200
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollTop = window.scrollY;
        const scrollLeft = window.scrollX;

        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = rect.top + scrollTop - 8;
            left = rect.left + scrollLeft + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + scrollTop + 8;
            left = rect.left + scrollLeft + rect.width / 2;
            break;
          case 'left':
            top = rect.top + scrollTop + rect.height / 2;
            left = rect.left + scrollLeft - 8;
            break;
          case 'right':
            top = rect.top + scrollTop + rect.height / 2;
            left = rect.right + scrollLeft + 8;
            break;
        }

        setCoords({ top, left });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const childWithRef = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
  });

  return (
    <>
      {childWithRef}
      {isVisible && createPortal(
        <div
          className={`tooltip tooltip-${position}`}
          style={{ top: coords.top, left: coords.left }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
