import { useState, useMemo, useCallback } from 'react';

/**
 * Number formatting utility for banking hierarchy.
 */
export const formatHierarchyNumber = (value) => {
  const num = Number(value) || 0;
  const absNum = Math.abs(num);
  if (absNum >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
  if (absNum >= 100000) return `${(num / 100000).toFixed(2)}L`;
  if (absNum >= 1000) return `${(num / 1000).toFixed(1)}T`;
  return new Intl.NumberFormat('en-IN').format(num);
};

export const getPercent = (achieved, target) => (!target ? 0 : Math.round((achieved / target) * 100));

export const formatStat = (value, pct, viewMode) =>
  viewMode === 'percent' ? `${pct}%` : formatHierarchyNumber(value);

export const STATUS_CONFIG = {
  achieved: { label: 'Achieved', color: '#2e7d32', bg: '#e8f5e9' },
  onTrack: { label: 'On Track', color: '#ed6c02', bg: '#fff4e5' },
  atRisk: { label: 'At Risk', color: '#d32f2f', bg: '#fdecea' },
  targetNotAlloted: { label: 'Target Not Alloted', color: '#8e8e93', bg: '#f4f4f5' },
};

export const getStatus = (pct, statusStr) => {
  if (statusStr) {
    const norm = statusStr.trim().toLowerCase();
    if (norm.includes('not alloted') || norm.includes('not allotted')) return STATUS_CONFIG.targetNotAlloted;
    if (norm === 'achieved') return STATUS_CONFIG.achieved;
    if (norm === 'on track') return STATUS_CONFIG.onTrack;
    if (norm === 'at risk') return STATUS_CONFIG.atRisk;
  }
  if (pct >= 100) return STATUS_CONFIG.achieved;
  if (pct >= 70) return STATUS_CONFIG.onTrack;
  return STATUS_CONFIG.atRisk;
};

export const buildHierarchy = (data) => {
  const zones = new Map();
  (data || []).forEach((item) => {
    if (!zones.has(item.zoneId)) {
      zones.set(item.zoneId, {
        id: item.zoneId,
        name: item.zoneName,
        regions: {},
        rank: item.rank ?? item.ranking,
        totalTarget: item.totalTarget,
        totalAchieved: item.totalAchieved,
        targetPending: item.targetPending,
        percentage: item.percentage,
        averagePercentage: item.averagePercentage,
        dapEmployeeName: item.dapEmployeeName,
        status: item.status,
      });
    }
    const zone = zones.get(item.zoneId);
    if (!zone.regions[item.regionId]) {
      zone.regions[item.regionId] = {
        id: item.regionId,
        name: item.regionName,
        branches: [],
        rank: item.rank ?? item.ranking,
        totalTarget: item.totalTarget,
        totalAchieved: item.totalAchieved,
        targetPending: item.targetPending,
        percentage: item.percentage,
        averagePercentage: item.averagePercentage,
        dapEmployeeName: item.dapEmployeeName,
        status: item.status,
      };
    }
    zone.regions[item.regionId].branches.push({
      id: item.branchId || item.id,
      name: item.branchName,
      branchCode: item.branchCode,
      rank: item.rank ?? item.ranking,
      totalTarget: item.totalTarget,
      totalAchieved: item.totalAchieved,
      targetPending: item.targetPending,
      percentage: item.percentage,
      averagePercentage: item.averagePercentage,
      dapEmployeeName: item.dapEmployeeName,
      status: item.status,
    });
  });

  return Array.from(zones.values()).map((zone) => ({
    ...zone,
    regions: Object.values(zone.regions),
  }));
};

/**
 * Custom hook for Common Hierarchy Table logic, search filtering, and pagination.
 */
export const useHierarchyTable = ({ data = [], groupLevel = 'zone' }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('value');
  const [expandedRows, setExpandedRows] = useState(new Set());

  const hierarchyData = useMemo(() => buildHierarchy(data), [data]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return hierarchyData;
    const term = searchTerm.toLowerCase();
    return hierarchyData.filter(
      (z) =>
        (z.name || '').toLowerCase().includes(term) ||
        (z.dapEmployeeName || '').toLowerCase().includes(term) ||
        z.regions.some(
          (r) =>
            (r.name || '').toLowerCase().includes(term) ||
            r.branches.some((b) => (b.name || '').toLowerCase().includes(term))
        )
    );
  }, [hierarchyData, searchTerm]);

  const toggleRow = useCallback((id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  return {
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode,
    expandedRows,
    toggleRow,
    filteredData,
    paginatedData,
  };
};

export default useHierarchyTable;
