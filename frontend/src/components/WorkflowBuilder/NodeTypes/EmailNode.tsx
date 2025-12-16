/**
 * Email Node Component
 * 
 * Node for sending emails via SMTP
 */

import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';

export function EmailNode({ data, selected }: NodeProps) {
  const safeData = data || {};
  const label = (safeData.label as string) || 'Email';
  const to = (safeData.to || '') as string;
  const subject = (safeData.subject || '') as string;

  // Extract animation props (added at runtime by nodeRegistry)
  const isAnimating = (data?.isAnimating as boolean | undefined) ?? false;
  const executionStatus = (data?.executionStatus as 'idle' | 'running' | 'completed' | 'failed' | undefined) ?? 'idle';

  const getSubtitle = () => {
    if (to && subject) {
      return `${to.length > 20 ? `${to.substring(0, 20)}...` : to} - ${subject.length > 20 ? `${subject.substring(0, 20)}...` : subject}`;
    }
    if (to) return to.length > 40 ? `${to.substring(0, 40)}...` : to;
    if (subject) return subject.length > 40 ? `${subject.substring(0, 40)}...` : subject;
    return 'Configure email';
  };

  return (
    <BaseNode
      label={label}
      icon="📧"
      category="integration"
      subtitle={getSubtitle()}
      hasInput={true}
      hasOutput={true}
      isAnimating={isAnimating}
      executionStatus={executionStatus}
      selected={selected}
    />
  );
}

