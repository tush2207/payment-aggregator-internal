'use client';

import { Fragment, memo, useCallback, useMemo, useState } from 'react';

import {
    Box,
    Button,
    ButtonGroup,
    Chip,
    CircularProgress,
    IconButton,
    InputAdornment,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';

import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import NoData from '&src/components/feedback/NoData';
import { NO_DATA_MESSAGES } from '../../constants/screenheader';
import { isRO } from '&src/constants';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

// 'zone' is selected first — matches the API default in useDashboard
// View toggle — show raw values or percentage-of-target for the
// Target / Achieved / Pending columns
const VIEW_MODE_OPTIONS = [
    { label: 'Value', value: 'value' },
    { label: '%', value: 'percent' },
];

// merged Name column replaces separate Zone/Region/Branch columns; Status added
const getTableHeaders = (groupLevel) => {
    const mainCol = groupLevel === 'zone' ? 'Zone' : groupLevel === 'region' ? 'Region' : 'Branch';
    return ['', 'Rank', mainCol, 'Employee Name', 'Status', 'Total Target', 'Achieved', 'Pending', 'Achievement %'];
};

const COLUMN_COUNT = 9;

const LEVEL_COLOR = { zone: '#c62828', region: '#1565c0', branch: '#2e7d32' };
const LEVEL_BG = ['#fff', '#fafafa', '#f5f5f5'];

// ─────────────────────────────────────────────────────────────
// PURE HELPERS  (no React state – safe to call inside useMemo)
// ─────────────────────────────────────────────────────────────

// ── Number formatting ──
// < 1,000           → plain number
// 1,000 – 99,999    → "T" (thousands)
// 1,00,000 – 99,99,999 → "L" (lakhs)
// >= 1,00,00,000    → "Cr" (crores)
const formatNumber = value => {
    const num = Number(value) || 0;
    const absNum = Math.abs(num);

    if (absNum >= 10000000) {
        return `${(num / 10000000).toFixed(2)}Cr`;
    }
    if (absNum >= 100000) {
        return `${(num / 100000).toFixed(2)}L`;
    }
    if (absNum >= 1000) {
        return `${(num / 1000).toFixed(1)}T`;
    }
    return new Intl.NumberFormat('en-IN').format(num);
};

const getPercent = (achieved, target) => (!target ? 0 : Math.round((achieved / target) * 100));

/**
 * Formats a Target / Achieved / Pending stat depending on the active
 * view mode: 'value' → formatted number (T/L/Cr); 'percent' → % of target.
 */
const formatStat = (value, pct, viewMode) =>
    viewMode === 'percent' ? `${pct}%` : formatNumber(value);

const progressColor = value => {
    if (value >= 90) { return '#2e7d32'; }
    if (value >= 70) { return '#ed6c02'; }
    return '#d32f2f';
};

const STATUS_CONFIG = {
    achieved: { label: 'Achieved', color: '#2e7d32', bg: '#e8f5e9' },
    onTrack: { label: 'On Track', color: '#ed6c02', bg: '#fff4e5' },
    atRisk: { label: 'At Risk', color: '#d32f2f', bg: '#fdecea' },
    targetNotAlloted: { label: 'Target Not Alloted', color: '#8e8e93', bg: '#f4f4f5' },
};

const getStatus = (pct, statusStr) => {
    if (statusStr) {
        const norm = statusStr.trim().toLowerCase();
        if (norm === 'target not alloted' || norm === 'target not allotted') {
            return STATUS_CONFIG.targetNotAlloted;
        }
        if (norm === 'achieved') { return STATUS_CONFIG.achieved; }
        if (norm === 'on track') { return STATUS_CONFIG.onTrack; }
        if (norm === 'at risk') { return STATUS_CONFIG.atRisk; }
    }
    if (pct >= 100) { return STATUS_CONFIG.achieved; }
    if (pct >= 70) { return STATUS_CONFIG.onTrack; }
    return STATUS_CONFIG.atRisk;
};

// ─────────────────────────────────────────────────────────────
// DATA BUILDERS
// ─────────────────────────────────────────────────────────────

/** Full Zone → Region → Branch hierarchy (used for "Zone" group-by) */
const buildHierarchy = data => {
    const zones = new Map();
    data.forEach(item => {
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
                branches: {},
            };
        }
        const region = zone.regions[item.regionId];

        if (!region.branches[item.branchId]) {
            region.branches[item.branchId] = {
                id: item.branchId,
                name: item.branchName,
                categories: [],
            };
        }
        region.branches[item.branchId].categories.push(item);
    });
    return Array.from(zones.values());
};

/** Flat list keyed at the chosen group level (used for Region / Branch group-by) */
const buildFlatList = (data, groupLevel) => {
    const map = new Map();
    data.forEach(item => {
        let key, id, name, extra;
        if (groupLevel === 'region') {
            key = `${item.zoneId}__${item.regionId}`;
            id = item.regionId;
            name = item.regionName;
            extra = { zoneId: item.zoneId, zoneName: item.zoneName };
        } else {
            // branch
            key = `${item.zoneId}__${item.regionId}__${item.branchId}`;
            id = item.branchId;
            name = item.branchName;
            extra = { zoneId: item.zoneId, regionId: item.regionId, zoneName: item.zoneName, regionName: item.regionName };
        }
        if (!map.has(key)) {
            map.set(key, {
                id,
                name,
                type: groupLevel,
                categories: [],
                rank: item.rank ?? item.ranking,
                totalTarget: item.totalTarget,
                totalAchieved: item.totalAchieved,
                targetPending: item.targetPending,
                percentage: item.percentage,
                averagePercentage: item.averagePercentage,
                status: item.status,
                dapEmployeeName: item.dapEmployeeName,
                ...extra
            });
        }
        map.get(key).categories.push(item);
    });
    return Array.from(map.values());
};

// ─────────────────────────────────────────────────────────────
// PROGRESS BAR CELL
// ─────────────────────────────────────────────────────────────

const ProgressCell = memo(({ pct }) => (
    <TableCell sx={{ width: 240 }}>
        <Typography fontWeight={700}>{pct}%</Typography>
        <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
                mt: 1,
                height: 8,
                borderRadius: 10,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                    borderRadius: 10,
                    backgroundColor: progressColor(pct),
                },
            }}
        />
    </TableCell>
));
ProgressCell.displayName = 'ProgressCell';

// ─────────────────────────────────────────────────────────────
// STATUS CELL
// ─────────────────────────────────────────────────────────────

const StatusCell = memo(({ pct, statusStr }) => {
    const status = getStatus(pct, statusStr);
    return (
        <TableCell>
            <Chip
                size="small"
                label={status.label}
                sx={{ fontWeight: 700, color: status.color, backgroundColor: status.bg }}
            />
        </TableCell>
    );
});
StatusCell.displayName = 'StatusCell';

// ─────────────────────────────────────────────────────────────
// CATEGORY DETAIL SUB-TABLE — shown inside an expanded row
// ─────────────────────────────────────────────────────────────

const CATEGORY_TABLE_HEADERS = ['Category', 'Status', 'Total Target', 'Achieved', 'Pending', 'Achievement %'];

const CategoryDetailTable = memo(({ categories = [], viewMode = 'value' }) => (
    <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table size="small">
            <TableHead>
                <TableRow sx={{ backgroundColor: '#ececec' }}>
                    {CATEGORY_TABLE_HEADERS.map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, color: '#555' }}>
                            {h}
                        </TableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {categories.map((cat, idx) => {
                    const catPct = cat.targetAchievedPercentage ?? cat.percentage ?? cat.averagePercentage ?? 0;
                    return (
                        <TableRow key={`cat-${idx}`} hover>
                            <TableCell>
                                <Typography fontWeight={600}>{cat.category}</Typography>
                            </TableCell>
                            <StatusCell pct={catPct} statusStr={cat.status} />
                            <TableCell>{formatStat(cat.totalTarget, 100, viewMode)}</TableCell>
                            <TableCell sx={{ color: '#2e7d32', fontWeight: 700 }}>
                                {formatStat(cat.targetAcheived ?? cat.totalAchieved, catPct, viewMode)}
                            </TableCell>
                            <TableCell sx={{ color: '#d32f2f', fontWeight: 700 }}>
                                {formatStat(cat.targetPending, Math.max(0, 100 - catPct), viewMode)}
                            </TableCell>
                            <TableCell sx={{ width: 200 }}>
                                <Typography fontWeight={700}>{catPct}%</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(catPct, 100)}
                                    sx={{
                                        mt: 1,
                                        height: 8,
                                        borderRadius: 10,
                                        backgroundColor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 10,
                                            backgroundColor: progressColor(catPct),
                                        },
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    </TableContainer>
));
CategoryDetailTable.displayName = 'CategoryDetailTable';

// ─────────────────────────────────────────────────────────────
// RECURSIVE HIERARCHY ROW
// ─────────────────────────────────────────────────────────────

const HierarchyRow = memo(
    ({
        id,
        name,
        type,
        node,
        level = 0,
        rank,
        parentLabel,
        expandedRows,
        onToggle,
        ancestorIds = {},
        onExpand,
        expandedCategories = {},
        onCategoriesFetched,
        loadingMap = {},
        localLoadingMap = {},
        onExpandStart,
        viewMode = 'value',
    }) => {
        const isExpanded = Boolean(expandedRows[id]);

        // ids scoped to THIS row's level — sent to the API on expand
        const rowIds =
            type === 'zone'
                ? { zoneId: id }
                : type === 'region'
                    ? { zoneId: ancestorIds.zoneId, regionId: id }
                    : { zoneId: ancestorIds.zoneId, regionId: ancestorIds.regionId, branchId: id };
        const rowCacheKey = JSON.stringify(rowIds);

        const fetchedCategories = expandedCategories[rowCacheKey];
        const totals = {
            totalTarget: node.totalTarget ?? 0,
            totalAchieved: node.totalAchieved ?? node.targetAcheived ?? 0,
            totalPending: node.targetPending ?? 0,
            percentage: node.percentage ?? node.targetAchievedPercentage ?? 0,
            status: node.status,
        };
        const isLoadingDetail = onExpand && fetchedCategories === undefined && (Boolean(loadingMap[rowCacheKey]) || Boolean(localLoadingMap[rowCacheKey]));

        const handleToggleClick = () => {
            const willOpen = !isExpanded;
            onToggle(id);
            if (willOpen && onExpand && fetchedCategories === undefined) {
                onExpandStart?.(rowCacheKey);
                Promise.resolve(onExpand(rowIds)).then(categories => {
                    onCategoriesFetched?.(rowCacheKey, categories ?? []);
                });
            }
        };

        return (
            <Fragment>
                {/* ── MAIN ROW ── */}
                <TableRow
                    hover
                    sx={{ backgroundColor: LEVEL_BG[level] ?? '#f0f0f0', transition: '0.2s' }}>
                    {/* expand icon */}
                    <TableCell width={60}>
                        {(node.regions || node.branches || node.categories) && (
                            <IconButton size="small" onClick={handleToggleClick}>
                                {isExpanded ? (
                                    <KeyboardArrowUpRoundedIcon />
                                ) : (
                                    <KeyboardArrowDownRoundedIcon />
                                )}
                            </IconButton>
                        )}
                    </TableCell>

                    {/* rank — only shown on top-level rows (level 0) */}
                    <TableCell>
                        {level === 0 && rank && (
                            <Chip
                                label={`#${rank}`}
                                size="small"
                                sx={{
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg,#ffd43b,#fcc419)',
                                    color: '#000',
                                }}
                            />
                        )}
                    </TableCell>

                    {/* name */}
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', pl: level * 5 }}>
                            {level > 0 && (
                                <Box
                                    sx={{
                                        width: 18,
                                        height: 2,
                                        backgroundColor: '#c62828',
                                        mr: 1.5,
                                    }}
                                />
                            )}
                            <Box>
                                <Typography fontWeight={700} color={LEVEL_COLOR[type] ?? '#333'}>
                                    {name}
                                </Typography>
                                {parentLabel && (
                                    <Typography variant="caption" color="text.secondary">
                                        {parentLabel}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </TableCell>

                    <TableCell>
                        <Typography fontWeight={600} variant="body2" color="text.secondary">
                            {node.dapEmployeeName || '-'}
                        </Typography>
                    </TableCell>

                    <StatusCell pct={totals.percentage} statusStr={totals.status} />

                    <TableCell>{formatStat(totals.totalTarget, 100, viewMode)}</TableCell>
                    <TableCell sx={{ color: '#2e7d32', fontWeight: 700 }}>
                        {formatStat(totals.totalAchieved, totals.percentage, viewMode)}
                    </TableCell>
                    <TableCell sx={{ color: '#d32f2f', fontWeight: 700 }}>
                        {formatStat(totals.totalPending, Math.max(0, 100 - totals.percentage), viewMode)}
                    </TableCell>
                    <ProgressCell pct={totals.percentage} />
                </TableRow>

                {/* ── LEAF CATEGORY DETAIL — separate nested sub-table ── */}
                {isExpanded && (
                    <TableRow sx={{ backgroundColor: '#fcfcfc' }}>
                        <TableCell colSpan={COLUMN_COUNT} sx={{ py: 0, px: 0, border: 0 }}>
                            <Box sx={{ pl: (level + 1) * 5 + 2, pr: 2, py: 2 }}>
                                {isLoadingDetail ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                                        <CircularProgress size={30} sx={{ color: '#c62828', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Loading category details…
                                        </Typography>
                                    </Box>
                                ) : (fetchedCategories ?? node.categories ?? []).length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                        No category data found
                                    </Typography>
                                ) : (
                                    <CategoryDetailTable
                                        categories={fetchedCategories ?? node.categories ?? []}
                                        viewMode={viewMode}
                                    />
                                )}
                            </Box>
                        </TableCell>
                    </TableRow>
                )}
            </Fragment>
        );
    },
);
HierarchyRow.displayName = 'HierarchyRow';

// ─────────────────────────────────────────────────────────────
// PILL TOGGLE  (ButtonGroup — replaces the old Tabs control)
// ─────────────────────────────────────────────────────────────

const PillToggle = memo(({ label, options, value, onChange }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {label && (
            <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ whiteSpace: 'nowrap' }}>
                {label}
            </Typography>
        )}
        <ButtonGroup
            size="small"
            sx={{
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 0 0 1.5px rgba(0,0,0,0.10)',
                '& .MuiButtonGroup-grouped': {
                    border: 'none !important',
                    borderRadius: '0 !important',
                    minWidth: 72,
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    textTransform: 'none',
                },
            }}>
            {options.map((opt, idx) => {
                const isActive = value === idx;
                return (
                    <Button
                        key={opt.value}
                        onClick={() => onChange(idx)}
                        variant={isActive ? 'contained' : 'outlined'}
                        sx={{
                            ...(isActive
                                ? {
                                    background: 'linear-gradient(135deg,#b71c1c,#e53935)',
                                    color: '#fff',
                                    boxShadow: '0 3px 10px rgba(183,28,28,0.35)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg,#c62828,#ef5350)',
                                    },
                                }
                                : {
                                    background: '#fff',
                                    color: 'text.secondary',
                                    '&:hover': { background: '#fff5f5', color: '#b71c1c' },
                                }),
                        }}>
                        {opt.label}
                    </Button>
                );
            })}
        </ButtonGroup>
    </Box>
));
PillToggle.displayName = 'PillToggle';

// ─────────────────────────────────────────────────────────────
// TOOLBAR
// ─────────────────────────────────────────────────────────────

const TableToolbar = memo(
    ({ search, onSearch, groupIdx, onGroupChange, onExport, isExporting, viewMode, onViewModeChange, showValueToggle, pillOptions }) => (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            {/* SEARCH */}
            <TextField
                size="small"
                placeholder="Search zone / region / branch…"
                value={search}
                onChange={e => onSearch(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                    ),
                }}
                sx={{ width: 280, flexShrink: 0 }}
            />

            {/* GROUP BY — ButtonGroup (was Tabs); switching this re-fires the API */}
            {!isRO && (
                <PillToggle
                    label="Group by:"
                    options={pillOptions}
                    value={groupIdx}
                    onChange={onGroupChange}
                />
            )}

            {/* VIEW MODE — Value vs % — purely a display toggle, no API call */}
            {showValueToggle && <PillToggle
                label="Show:"
                options={VIEW_MODE_OPTIONS}
                value={VIEW_MODE_OPTIONS.findIndex(o => o.value === viewMode)}
                onChange={idx => onViewModeChange(VIEW_MODE_OPTIONS[idx].value)}
            />
            }
            {/* EXPORT — same filters + group-by as the table */}
            <Box sx={{ ml: 'auto' }}>
                <Button
                    variant="standard"
                    size="small"
                    startIcon={<DownloadRoundedIcon />}
                    onClick={onExport}
                    disabled={isExporting}
                    sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '10px' }}>
                    {isExporting ? 'Exporting…' : 'Export'}
                </Button>
            </Box>
        </Box>
    ),
);
TableToolbar.displayName = 'TableToolbar';

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────

/**
 * Controlled / uncontrolled group-by:
 * Pass `groupByIndex` + `onGroupByChange` from the parent (Dashboard) so that
 * switching Zone → Region → Branch triggers the real API call in useDashboard.
 * If omitted, the component falls back to local state (standalone usage).
 */
const CommonHierarchyTable = ({
    data = [],
    groupByValue,
    groupByOptions = ['zone', 'region', 'branch'],
    onGroupByChange,
    onExport,
    isExporting = false,
    showValueToggle = false,
    /**
     * Called with { zoneId, regionId, branchId } (only the ids relevant to
     * the row being expanded) when a zone/region/branch row is expanded.
     * Should return a Promise<categories[]> — typically
     * useDashboard.fetchCategorySummaryByLevel, which calls getCategorySummary.
     * Optional — if omitted, falls back to the locally aggregated categories.
     */
    onExpand,
    expandLoadingMap = {},
    isLoading = false,
    pagination,
    onPageChange,
    onPageSizeChange,
    search: externalSearch,
    onSearch: externalOnSearch,
}) => {
    const [expandedRows, setExpandedRows] = useState({});
    const [localSearch, setLocalSearch] = useState('');
    const [internalGroupValue, setInternalGroupValue] = useState('zone'); // 0=Zone | 1=Region | 2=Branch
    const [localPage, setLocalPage] = useState(0);
    const [localPageSize, setLocalPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [viewMode, setViewMode] = useState('value'); // 'value' | 'percent'
    // API-fetched category details, keyed by JSON.stringify({zoneId,regionId,branchId})
    const [expandedCategories, setExpandedCategories] = useState({});
    const [localExpandLoadingMap, setLocalExpandLoadingMap] = useState({});

    const isPaginatedControlled = pagination !== undefined;
    const page = isPaginatedControlled ? pagination.page : localPage;
    const pageSize = isPaginatedControlled ? pagination.pageSize : localPageSize;
    const isSearchControlled = externalSearch !== undefined;
    const search = isSearchControlled ? externalSearch : localSearch;

    const handleExpandStart = useCallback((cacheKey) => {
        setLocalExpandLoadingMap(prev => ({ ...prev, [cacheKey]: true }));
    }, []);

    const handleCategoriesFetched = useCallback((cacheKey, categories) => {
        setLocalExpandLoadingMap(prev => ({ ...prev, [cacheKey]: false }));
        setExpandedCategories(prev => ({ ...prev, [cacheKey]: categories }));
    }, []);

    const isControlled = groupByValue !== undefined;
    const groupLevel = isControlled ? groupByValue : internalGroupValue;

    const pillOptions = useMemo(() => {
        return groupByOptions.map(val => ({
            label: val.charAt(0).toUpperCase() + val.slice(1),
            value: val
        }));
    }, [groupByOptions]);

    const activePillIndex = useMemo(() => {
        const idx = pillOptions.findIndex(o => o.value === groupLevel);
        return idx !== -1 ? idx : 0;
    }, [pillOptions, groupLevel]);

    const toggleExpand = useCallback(key => {
        // Accordion behaviour: expanding a row collapses any other expanded
        // row. Clicking an already-expanded row simply collapses it — no
        // API call happens on close (only the `willOpen` branch in
        // HierarchyRow's handleToggleClick fires the fetch).
        setExpandedRows(prev => (prev[key] ? {} : { [key]: true }));
    }, []);

    const handleGroupChange = useCallback(
        idx => {
            const nextValue = pillOptions[idx]?.value || 'zone';
            if (isControlled) {
                onGroupByChange?.(nextValue);
            } else {
                setInternalGroupValue(nextValue);
            }
            setExpandedRows({});
            setExpandedCategories({});
            if (isPaginatedControlled) {
                onPageChange?.(0);
            } else {
                setLocalPage(0);
            }
        },
        [isControlled, onGroupByChange, pillOptions, isPaginatedControlled, onPageChange],
    );

    // ── HIERARCHY (zone group‑by only) ──
    const hierarchyData = useMemo(() => buildHierarchy(data), [data]);

    // ── FLAT LIST (region / branch group‑by) ──
    const flatList = useMemo(
        () => (groupLevel !== 'zone' ? buildFlatList(data, groupLevel) : []),
        [data, groupLevel],
    );

    // ── search filter for zone list ──
    const filteredZones = useMemo(() => {
        if (groupLevel !== 'zone') { return []; }
        const q = search.trim().toLowerCase();
        return q ? hierarchyData.filter(z => z.name?.toLowerCase().includes(q)) : hierarchyData;
    }, [hierarchyData, groupLevel, search]);

    // ── search filter for flat list ──
    const filteredFlat = useMemo(() => {
        if (groupLevel === 'zone') { return []; }
        const q = search.trim().toLowerCase();
        if (!q) { return flatList; }
        return flatList.filter(
            row =>
                row.name?.toLowerCase().includes(q) ||
                row.zoneName?.toLowerCase().includes(q) ||
                row.regionName?.toLowerCase().includes(q),
        );
    }, [flatList, groupLevel, search]);

    // source array for count and slicing
    const sourceList = groupLevel === 'zone' ? filteredZones : filteredFlat;
    const totalCount = isPaginatedControlled && pagination.totalCount !== undefined ? pagination.totalCount : sourceList.length;

    const visibleList = useMemo(() => {
        if (isPaginatedControlled) {
            return sourceList;
        }
        const start = page * pageSize;
        return sourceList.slice(start, start + pageSize);
    }, [sourceList, page, pageSize, isPaginatedControlled]);

    const handleSearch = useCallback(value => {
        if (isSearchControlled) {
            externalOnSearch?.(value);
        } else {
            setLocalSearch(value);
            setLocalPage(0);
        }
    }, [isSearchControlled, externalOnSearch]);

    const handlePageChange = useCallback((_, newPage) => {
        if (isPaginatedControlled) {
            onPageChange?.(newPage);
        } else {
            setLocalPage(newPage);
        }
        setExpandedRows({});
    }, [isPaginatedControlled, onPageChange]);

    const handlePageSizeChange = useCallback(e => {
        const newSize = parseInt(e.target.value, 10);
        if (isPaginatedControlled) {
            onPageSizeChange?.(newSize);
        } else {
            setLocalPageSize(newSize);
            setLocalPage(0);
        }
        setExpandedRows({});
    }, [isPaginatedControlled, onPageSizeChange]);

    // ── EMPTY STATE ──
    const isEmpty = visibleList.length === 0;

    return (
        <Box>
            <TableToolbar
                showValueToggle={showValueToggle}
                search={search}
                onSearch={handleSearch}
                groupIdx={activePillIndex}
                pillOptions={pillOptions}
                onGroupChange={handleGroupChange}
                onExport={onExport}
                isExporting={isExporting}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            <TableContainer component={Paper} sx={{ overflow: 'hidden' }}>
                <Table>
                    {/* HEADER */}
                    <TableHead>
                        <TableRow
                            sx={{
                                background:
                                    'linear-gradient(90deg,#b71c1c,#d32f2f,#fcc419,#d32f2f,#b71c1c)',
                            }}>
                            {getTableHeaders(groupLevel).map((h, i) => (
                                <TableCell key={i} sx={{ color: '#fff', fontWeight: 700 }}>
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    {/* BODY */}
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={COLUMN_COUNT} align="center" sx={{ py: 10 }}>
                                    <CircularProgress size={40} sx={{ color: '#c62828' }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                        Loading data...
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : isEmpty ? (
                            <TableRow>
                                <TableCell colSpan={COLUMN_COUNT} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">
                                        {search ? (
                                            `No results for "${search}"`
                                        ) : (
                                            <NoData {...NO_DATA_MESSAGES.organizationPerformance} />
                                        )}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleList.map(node => (
                                <HierarchyRow
                                    key={node.id}
                                    id={node.id}
                                    name={node.name}
                                    type={groupLevel === 'zone' ? 'zone' : node.type}
                                    rank={node.rank ?? node.ranking}
                                    parentLabel={
                                        groupLevel === 'region' && node.zoneName
                                            ? `Zone: ${node.zoneName}`
                                            : groupLevel === 'branch' && node.regionName
                                                ? `Region: ${node.regionName}`
                                                : null
                                    }
                                    node={node}
                                    level={0}
                                    expandedRows={expandedRows}
                                    onToggle={toggleExpand}
                                    // Top-level ancestor ids for non-zone group levels
                                    // (region rows already carry zoneId; branch rows carry zoneId+regionId)
                                    ancestorIds={
                                        groupLevel === 'region'
                                            ? { zoneId: node.zoneId }
                                            : groupLevel === 'branch'
                                                ? { zoneId: node.zoneId, regionId: node.regionId }
                                                : {}
                                    }
                                    onExpand={onExpand}
                                    expandedCategories={expandedCategories}
                                    onCategoriesFetched={handleCategoriesFetched}
                                    onExpandStart={handleExpandStart}
                                    loadingMap={expandLoadingMap}
                                    localLoadingMap={localExpandLoadingMap}
                                    viewMode={viewMode}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>

                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onPageChange={handlePageChange}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={handlePageSizeChange}
                    rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                    sx={{ borderTop: '1px solid #f1f1f1' }}
                />
            </TableContainer>
        </Box>
    );
};

export default memo(CommonHierarchyTable);