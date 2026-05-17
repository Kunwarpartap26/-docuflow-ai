import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  validated: {
    label: 'Validated',
    icon: CheckCircle,
    className: 'badge-validated',
  },
  reviewed: {
    label: 'Reviewed',
    icon: CheckCircle,
    className: 'badge-validated',
  },
  processing: {
    label: 'Processing',
    icon: Clock,
    className: 'badge-processing',
  },
  extracted: {
    label: 'Pending Review',
    icon: AlertTriangle,
    className: 'badge-pending',
  },
  flagged: {
    label: 'Flagged',
    icon: XCircle,
    className: 'badge-flagged',
  },
};

const ValidationBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['extracted'];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-sm ${config.className}`}>
      <Icon size={11} />
      {config.label}
    </span>
  );
};

export default ValidationBadge;
