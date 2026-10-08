import { useState, useEffect, useCallback } from 'react';
import locationServices from '&src/services/locationServices';

/**
 * Custom hook encapsulating the business logic for the Admin Role & Location Switcher.
 * Handles role changes, hierarchical location data fetching (Zone -> Region -> Branch),
 * validation, and session persistence.
 */
export const useAdminRoleSwitcher = ({ open, currentUser, onClose }) => {
  const [role, setRole] = useState(currentUser?.role || sessionStorage.getItem('role') || 'CO');
  const [validationError, setValidationError] = useState('');

  // Location master datasets from API
  const [zonesList, setZonesList] = useState([]);
  const [regionsList, setRegionsList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Selected values (initially null to display "Select Zone", "Select Region", "Select Branch")
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Fetch Zones from Location API
  const loadZones = useCallback(async () => {
    try {
      setLoadingLocations(true);
      const res = await locationServices.getZones();
      const data = res?.data?.data || res?.data || [];
      if (Array.isArray(data)) {
        setZonesList(data);
      } else {
        setZonesList([]);
      }
    } catch (e) {
      console.debug('Failed to fetch zones:', e);
      setZonesList([]);
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  // Fetch Regions for a specific Zone
  const loadRegions = useCallback(async (zoneId) => {
    if (!zoneId) {
      setRegionsList([]);
      return;
    }
    try {
      setLoadingLocations(true);
      const res = await locationServices.getRegions(zoneId);
      const data = res?.data?.data || res?.data || [];
      if (Array.isArray(data)) {
        setRegionsList(data);
      } else {
        setRegionsList([]);
      }
    } catch (e) {
      console.debug('Failed to fetch regions:', e);
      setRegionsList([]);
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  // Fetch Branches for a specific Zone + Region
  const loadBranches = useCallback(async (zoneId, regionId) => {
    if (!zoneId && !regionId) {
      setBranchesList([]);
      return;
    }
    try {
      setLoadingLocations(true);
      const res = await locationServices.getBranches(zoneId || null, regionId || null);
      const data = res?.data?.data || res?.data || [];
      if (Array.isArray(data)) {
        setBranchesList(data);
      } else {
        setBranchesList([]);
      }
    } catch (e) {
      console.debug('Failed to fetch branches:', e);
      setBranchesList([]);
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  // Initial load when modal opens
  useEffect(() => {
    if (open) {
      const curRole = currentUser?.role || sessionStorage.getItem('role') || 'CO';
      setRole(curRole);
      setValidationError('');

      // Initially show unselected state ("Select Zone", "Select Region", "Select Branch")
      setSelectedZone(null);
      setSelectedRegion(null);
      setSelectedBranch(null);
      setRegionsList([]);
      setBranchesList([]);

      // Fetch zone list so options are immediately available for selection
      loadZones();
    }
  }, [open, currentUser, loadZones]);

  // Handle role card selection
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setValidationError('');
    // Clear location selections when switching role so user selects fresh scope
    setSelectedZone(null);
    setSelectedRegion(null);
    setSelectedBranch(null);
    setRegionsList([]);
    setBranchesList([]);

    if (newRole !== 'CO' && zonesList.length === 0) {
      loadZones();
    }
  };

  // Handle Zone selection change
  const handleZoneChange = (newZone) => {
    setSelectedZone(newZone);
    setSelectedRegion(null);
    setSelectedBranch(null);
    setBranchesList([]);
    setValidationError('');

    const zId = newZone?.zoneId || (typeof newZone === 'string' ? newZone : null);
    if (zId) {
      loadRegions(zId);
    } else {
      setRegionsList([]);
    }
  };

  // Handle Region selection change
  const handleRegionChange = (newRegion) => {
    setSelectedRegion(newRegion);
    setSelectedBranch(null);
    setValidationError('');

    const zId = selectedZone?.zoneId || null;
    const rId = newRegion?.regionId || (typeof newRegion === 'string' ? newRegion : null);
    if (zId && rId) {
      loadBranches(zId, rId);
    } else {
      setBranchesList([]);
    }
  };

  // Handle Branch selection change
  const handleBranchChange = (newBranch) => {
    if (typeof newBranch === 'string') {
      setSelectedBranch({ branchId: '2394', branchName: newBranch });
    } else {
      setSelectedBranch(newBranch);
    }
    setValidationError('');
  };

  // Apply Role & Scope View
  const handleApply = () => {
    if (role === 'ZO' && !selectedZone) {
      setValidationError('Please select a Zone to continue.');
      return;
    }
    if (role === 'RO') {
      if (!selectedZone) {
        setValidationError('Please select a Zone first.');
        return;
      }
      if (!selectedRegion) {
        setValidationError('Please select a Region to continue.');
        return;
      }
    }
    if (role === 'BO') {
      if (!selectedZone) {
        setValidationError('Please select a Zone first.');
        return;
      }
      if (!selectedRegion) {
        setValidationError('Please select a Region first.');
        return;
      }
      if (!selectedBranch) {
        setValidationError('Please enter or select a Branch to continue.');
        return;
      }
    }

    const zId = role === 'CO' ? '1109' : (selectedZone?.zoneId || '1109');
    const zName = role === 'CO' ? 'Central Office' : (selectedZone?.zoneName || (typeof selectedZone === 'string' ? selectedZone : 'Central Office'));

    const rId = role === 'CO' || role === 'ZO' ? (role === 'CO' ? '1169' : '') : (selectedRegion?.regionId || '1169');
    const rName = role === 'CO' || role === 'ZO' ? (role === 'CO' ? 'Central Office' : '') : (selectedRegion?.regionName || (typeof selectedRegion === 'string' ? selectedRegion : ''));

    const bId = role === 'BO' ? (selectedBranch?.branchId || '2394') : (role === 'CO' ? '2394' : '');
    const bName = role === 'BO' ? (selectedBranch?.branchName || (typeof selectedBranch === 'string' ? selectedBranch : 'CHEMBUR')) : (role === 'CO' ? 'CENTRAL OFFICE' : '');

    const updated = {
      ...currentUser,
      role,
      locationType: role,
      zoneId: zId,
      zoneName: zName,
      Zone_Name: zName,
      regionId: rId,
      regionName: rName,
      Region_Name: rName,
      branchId: bId,
      branchName: bName,
      Branch_Name: bName,
    };

    sessionStorage.setItem('role', role);
    if (role === 'RO' || role === 'ZO' || role === 'BO') {
      sessionStorage.setItem('simulatedRegion', rName || zName);
      sessionStorage.setItem('adminViewMode', 'true');
    } else {
      sessionStorage.removeItem('simulatedRegion');
      sessionStorage.removeItem('adminViewMode');
    }

    sessionStorage.setItem('userDetails', JSON.stringify(updated));
    localStorage.setItem('userDetails', JSON.stringify(updated));
    window.dispatchEvent(new Event('user-session-changed'));
    window.dispatchEvent(new Event('storage'));
    if (onClose) onClose();
    window.location.reload();
  };

  // Reset to default Central Office view
  const handleResetToDefault = () => {
    const defaultProfile = {
      ...currentUser,
      role: 'CO',
      locationType: 'CO',
      zoneId: '1109',
      zoneName: 'Central Office',
      Zone_Name: 'Central Office',
      regionId: '1169',
      regionName: 'Central Office',
      Region_Name: 'Central Office',
      branchId: '2394',
      branchName: 'CENTRAL OFFICE',
      Branch_Name: 'CENTRAL OFFICE',
    };
    sessionStorage.setItem('role', 'CO');
    sessionStorage.removeItem('simulatedRegion');
    sessionStorage.removeItem('adminViewMode');
    sessionStorage.setItem('userDetails', JSON.stringify(defaultProfile));
    localStorage.setItem('userDetails', JSON.stringify(defaultProfile));
    window.dispatchEvent(new Event('user-session-changed'));
    window.dispatchEvent(new Event('storage'));
    if (onClose) onClose();
    window.location.reload();
  };

  const selectedZoneLabel = selectedZone?.zoneName || (typeof selectedZone === 'string' ? selectedZone : '');
  const selectedRegionLabel = selectedRegion?.regionName || (typeof selectedRegion === 'string' ? selectedRegion : '');
  const selectedBranchLabel = selectedBranch?.branchName || (typeof selectedBranch === 'string' ? selectedBranch : '');

  return {
    role,
    validationError,
    zonesList,
    regionsList,
    branchesList,
    loadingLocations,
    selectedZone,
    selectedRegion,
    selectedBranch,
    selectedZoneLabel,
    selectedRegionLabel,
    selectedBranchLabel,
    handleRoleChange,
    handleZoneChange,
    handleRegionChange,
    handleBranchChange,
    handleApply,
    handleResetToDefault,
  };
};

export default useAdminRoleSwitcher;
