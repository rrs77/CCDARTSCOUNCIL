import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  Save, 
  X, 
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  GripVertical,
  Link2,
  Check,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';
import { useDropZoneStyle, useDropFlash } from './dnd';
import { customObjectivesApi } from '../config/customObjectivesApi';
import { seedReceptionDramaObjectives } from '../utils/seedReceptionDrama';
import { setupSecondaryDramaObjectives } from '../utils/setupSecondaryDramaObjectives';
import { setupDanceObjectives } from '../utils/setupDanceObjectives';
import type { 
  CustomObjectiveYearGroupWithAreas, 
  CustomObjectiveFormData,
  CustomObjectiveCSVRow 
} from '../types/customObjectives';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../contexts/SettingsContextNew';
import { normalizeYearGroupToken, resolveYearGroupFromToken } from '../utils/yearGroupSectionOrder';
import { buildObjectiveSetFolderTree } from '../utils/objectiveSetFolders';
import { cn } from '@/lib/utils';

// Draggable Year Group Item
interface DraggableYearGroupProps {
  yearGroup: CustomObjectiveYearGroupWithAreas;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  onDragEnd: () => void;
  children: React.ReactNode;
}

function DraggableYearGroup({ yearGroup, index, isSelected, onSelect, onReorder, onDragEnd, children }: DraggableYearGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { flashClass, triggerFlash } = useDropFlash();

  const [{ handlerId, isOver, canDrop }, drop] = useDrop({
    accept: 'yearGroup',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      onReorder(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    drop() {
      triggerFlash();
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'yearGroup',
    item: () => ({ index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    end: () => onDragEnd()
  });

  drag(drop(ref));

  const dropZoneClass = useDropZoneStyle({ isOver, canDrop, variant: 'inline' });

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      data-handler-id={handlerId}
      className={`transition-all rounded-lg ${isDragging ? 'ring-2 ring-[#a9a3ff] shadow-lg' : ''} ${dropZoneClass} ${flashClass}`}
    >
      {children}
    </div>
  );
}

interface CustomObjectivesAdminProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

export function CustomObjectivesAdmin({ isOpen, onClose, embedded = false }: CustomObjectivesAdminProps) {
  const { user } = useAuth();
  const { customYearGroups, yearGroupSections } = useSettings();
  const isAdmin = user?.role === 'admin' || user?.role === 'superuser';
  
  // Get available year group names for linking
  const availableYearGroups = (customYearGroups || []).map(yg => yg.name);
  
  const [yearGroups, setYearGroups] = useState<CustomObjectiveYearGroupWithAreas[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYearGroup, setSelectedYearGroup] = useState<string | null>(null);
  const [editingYearGroup, setEditingYearGroup] = useState<string | null>(null);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CustomObjectiveFormData>({
    year_group: { name: '', description: '', color: '#3B82F6', linked_year_groups: [] },
    areas: []
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneData, setCloneData] = useState({ sourceId: '', targetName: '', targetColor: '#3B82F6' });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  /** KS and subject folders start collapsed (ids in the set = collapsed). */
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<Set<string>>(new Set());
  const [collapsedSubjectFolderIds, setCollapsedSubjectFolderIds] = useState<Set<string>>(new Set());
  const [subjectSectionsSeeded, setSubjectSectionsSeeded] = useState(false);
  /** Right-panel area section headings (e.g. Communication and Language) — collapsed by default. */
  const [expandedContentSections, setExpandedContentSections] = useState<Set<string>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const yearGroupIndexById = React.useMemo(() => {
    const map = new Map<string, number>();
    yearGroups.forEach((group, index) => {
      map.set(group.id, index);
    });
    return map;
  }, [yearGroups]);

  const sectionOrder = React.useMemo(() => {
    const source =
      yearGroupSections && yearGroupSections.length > 0
        ? yearGroupSections
        : [{ id: 'other', label: 'Other', sortOrder: 999, yearGroupIds: [] }];
    return [...source].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [yearGroupSections]);

  const sectionLabelByCustomYearGroupName = React.useMemo(() => {
    const labelByCanonicalId = new Map<string, string>();
    sectionOrder.forEach((section) => {
      (section.yearGroupIds || []).forEach((token) => {
        const resolved = resolveYearGroupFromToken(customYearGroups || [], token);
        if (resolved && !labelByCanonicalId.has(resolved.id)) {
          labelByCanonicalId.set(resolved.id, section.label);
        }
      });
    });

    const byLinkedName = new Map<string, string>();
    (customYearGroups || []).forEach((group) => {
      const label = labelByCanonicalId.get(group.id);
      if (!label) return;
      byLinkedName.set(normalizeYearGroupToken(group.name), label);
      byLinkedName.set(normalizeYearGroupToken(group.id), label);
    });
    return byLinkedName;
  }, [sectionOrder, customYearGroups]);

  /** KS → Subject → year-group sets (name-based fallback so EYFS sets are not dumped in Other). */
  const objectiveFolders = React.useMemo(
    () =>
      buildObjectiveSetFolderTree(yearGroups, {
        sections: sectionOrder,
        customYearGroups: customYearGroups || [],
        sectionLabelByLinkedName: sectionLabelByCustomYearGroupName,
      }),
    [yearGroups, sectionOrder, customYearGroups, sectionLabelByCustomYearGroupName],
  );

  // First paint: collapse every KS and subject folder (objective groups stay collapsed too).
  React.useEffect(() => {
    if (subjectSectionsSeeded || objectiveFolders.length === 0) return;
    setCollapsedSectionIds(new Set(objectiveFolders.map((s) => s.id)));
    setCollapsedSubjectFolderIds(
      new Set(objectiveFolders.flatMap((ks) => ks.subjects.map((s) => s.id))),
    );
    setSubjectSectionsSeeded(true);
  }, [objectiveFolders, subjectSectionsSeeded]);

  const toggleCollapsedId = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helper function to auto-resize textarea
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // Parse objectives from text using # as delimiter OR newlines
  const parseObjectivesFromText = (text: string) => {
    if (!text || !text.trim()) return [];
    
    // First try splitting by # delimiter
    if (text.includes('#')) {
      const objectives = text
        .split('#')
        .map(obj => obj.trim())
        .filter(obj => obj.length > 0)
        .map((obj, index) => ({
          code: '',
          text: obj,
          description: ''
        }));
      return objectives;
    }
    
    // If no # found, split by newlines (Enter key)
    const objectives = text
      .split('\n')
      .map(obj => obj.trim())
      .filter(obj => obj.length > 0) // Filter out empty lines
      .map((obj, index) => ({
        code: '',
        text: obj,
        description: ''
      }));
    
    return objectives;
  };

  // Handle objective text change with auto-parsing
  const handleObjectiveTextChange = (areaIndex: number, objectiveIndex: number, text: string) => {
    const parsedObjectives = parseObjectivesFromText(text || '');
    
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.map((a, i) => 
        i === areaIndex ? {
          ...a,
          objectives: parsedObjectives.length > 0 ? parsedObjectives : [{
            code: `OBJ${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            text: text || '',
            description: ''
          }]
        } : a
      )
    }));
  };

  useEffect(() => {
    if (isOpen || embedded) {
      loadData();
    }
  }, [isOpen, embedded]);

  // Keep section headings and strand groups collapsed when switching subject.
  useEffect(() => {
    if (selectedYearGroup) {
      setExpandedAreas(new Set());
      setExpandedContentSections(new Set());
    }
  }, [selectedYearGroup]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await customObjectivesApi.getCompleteStructure();
      setYearGroups(data);
      
      // Select first subject by default; leave all objective groups collapsed
      // so "I can" statements stay hidden until a group is clicked.
      if (data.length > 0 && !selectedYearGroup) {
        setSelectedYearGroup(data[0].id);
        setExpandedAreas(new Set());
      }
    } catch (error) {
      console.error('Failed to load custom objectives:', error);
      setMessage({ type: 'error', text: 'Failed to load custom objectives' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYearGroup = () => {
    setFormData({
      year_group: { name: '', description: '', color: '#3B82F6', linked_year_groups: [] },
      areas: []
    });
    setEditingYearGroup(null);
    setSaveStatus('idle');
    setShowForm(true);
  };

  const handleEditYearGroup = (yearGroup: CustomObjectiveYearGroupWithAreas) => {
    setFormData({
      year_group: {
        name: yearGroup.name,
        description: yearGroup.description || '',
        color: yearGroup.color,
        linked_year_groups: yearGroup.linked_year_groups || []
      },
      areas: yearGroup.areas.map(area => ({
        id: area.id,
        section: area.section || '', // Include section field
        name: area.name,
        description: area.description || '',
        objectives: area.objectives.map(obj => ({
          id: obj.id,
          code: obj.objective_code || '',
          text: obj.objective_text,
          description: obj.description || ''
        }))
      }))
    });
    setEditingYearGroup(yearGroup.id);
    setSaveStatus('idle');
    setShowForm(true);
  };

  const handleSaveYearGroup = async () => {
    try {
      console.log('🔄 Saving year group...', { editingYearGroup, formData });
      console.log('🔄 Areas in formData:', formData.areas);
      console.log('🔄 Number of areas:', formData.areas.length);
      
      // Check for duplicate objective codes within areas
      for (const area of formData.areas) {
        const codes = area.objectives.map(obj => obj.code || '').filter(code => code.trim() !== '');
        const uniqueCodes = new Set(codes);
        if (codes.length !== uniqueCodes.size) {
          const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
          setMessage({ type: 'error', text: `Duplicate objective codes found in area "${area.name}": ${[...new Set(duplicates)].join(', ')}. Please ensure all objective codes are unique within each area.` });
          return;
        }
      }
      
      if (editingYearGroup) {
        // Update existing year group
        console.log('🔄 Updating existing year group:', editingYearGroup);
        await customObjectivesApi.yearGroups.update(editingYearGroup, {
          name: formData.year_group.name,
          description: formData.year_group.description,
          color: formData.year_group.color,
          linked_year_groups: formData.year_group.linked_year_groups || []
        });

        // Update areas and objectives for existing year group
        console.log('🔄 Updating areas for existing year group:', formData.areas);
        for (const areaData of formData.areas as Array<{ id?: string; section?: string; name: string; description?: string; objectives: Array<{ id?: string; code: string; text: string; description?: string }> }>) {
          console.log('🔄 Processing area for update:', areaData);
          
          if (areaData.id) {
            // Update existing area
            console.log('🔄 Updating existing area:', areaData.id);
            await customObjectivesApi.areas.update(areaData.id, {
              section: areaData.section,
              name: areaData.name,
              description: areaData.description,
              sort_order: formData.areas.indexOf(areaData)
            });
            
            // Update objectives for this area
            for (const objectiveData of areaData.objectives) {
              if (objectiveData.id) {
                console.log('🔄 Updating existing objective:', objectiveData.id);
                await customObjectivesApi.objectives.update(objectiveData.id, {
                  objective_code: objectiveData.code,
                  objective_text: objectiveData.text,
                  description: objectiveData.description,
                  sort_order: areaData.objectives.indexOf(objectiveData)
                });
                     } else {
                       console.log('🔄 Creating new objective for existing area:', objectiveData);
                       await customObjectivesApi.objectives.create({
                         area_id: areaData.id,
                         objective_code: objectiveData.code,
                         objective_text: objectiveData.text,
                         description: objectiveData.description,
                         sort_order: areaData.objectives.indexOf(objectiveData)
                       });
                     }
            }
          } else {
            // Create new area
            console.log('🔄 Creating new area for existing year group:', areaData);
            const newArea = await customObjectivesApi.areas.create({
              year_group_id: editingYearGroup,
              section: areaData.section,
              name: areaData.name,
              description: areaData.description,
              sort_order: formData.areas.indexOf(areaData)
            });
            console.log('✅ New area created:', newArea);
            
            // Create objectives for new area
                   for (const objectiveData of areaData.objectives) {
                     console.log('🔄 Creating objective for new area:', objectiveData);
                     await customObjectivesApi.objectives.create({
                       area_id: newArea.id,
                       objective_code: objectiveData.code,
                       objective_text: objectiveData.text,
                       description: objectiveData.description,
                       sort_order: areaData.objectives.indexOf(objectiveData)
                     });
                   }
          }
        }
        
        setMessage({ type: 'success', text: 'Year group updated successfully' });
        setSaveStatus('success');
        // Auto-dismiss message after 3 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
        // Keep form open so user can see the success message
      } else {
        // Create new year group
        const newYearGroup = await customObjectivesApi.yearGroups.create({
          name: formData.year_group.name,
          description: formData.year_group.description,
          color: formData.year_group.color,
          sort_order: yearGroups.length,
          linked_year_groups: formData.year_group.linked_year_groups || []
        });

        // Create areas and objectives
        console.log('🔄 Creating areas:', formData.areas);
        for (const areaData of formData.areas) {
          console.log('🔄 Creating area:', areaData);
          const newArea = await customObjectivesApi.areas.create({
            year_group_id: newYearGroup.id,
            section: areaData.section,
            name: areaData.name,
            description: areaData.description,
            sort_order: formData.areas.indexOf(areaData)
          });
          console.log('✅ Area created:', newArea);

          for (const objectiveData of areaData.objectives) {
            await customObjectivesApi.objectives.create({
              area_id: newArea.id,
              objective_code: objectiveData.code,
              objective_text: objectiveData.text,
              description: objectiveData.description,
              sort_order: areaData.objectives.indexOf(objectiveData)
            });
          }
        }

        setMessage({ type: 'success', text: 'Year group created successfully' });
        setSaveStatus('success');
        // Auto-dismiss message after 3 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
        // Keep form open so user can see the success message
      }

      console.log('✅ Year group saved successfully');
      await loadData();
      // Don't auto-close - let user see the success message and close manually
    } catch (error: any) {
      console.error('❌ Failed to save year group:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      setMessage({ type: 'error', text: `Failed to save year group: ${error.message}` });
      setSaveStatus('error');
      // Auto-dismiss error after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    }
  };

  const handleDeleteYearGroup = async (id: string) => {
    // Check if year group is locked
    const yearGroup = yearGroups.find(yg => yg.id === id);
    if (yearGroup?.is_locked) {
      setMessage({ type: 'error', text: 'Cannot delete locked year group. Only admins can unlock it first.' });
      return;
    }
    
    if (confirm('Are you sure you want to delete this year group? This will also delete all associated areas and objectives.')) {
      try {
        await customObjectivesApi.yearGroups.delete(id);
        setMessage({ type: 'success', text: 'Year group deleted successfully' });
        await loadData();
      } catch (error) {
        console.error('Failed to delete year group:', error);
        setMessage({ type: 'error', text: 'Failed to delete year group' });
      }
    }
  };

  const handleToggleLock = async (id: string) => {
    if (!isAdmin) {
      setMessage({ type: 'error', text: 'Only administrators can lock/unlock year groups.' });
      return;
    }
    
    const yearGroup = yearGroups.find(yg => yg.id === id);
    if (!yearGroup) return;
    
    const newLockStatus = !yearGroup.is_locked;
    
    try {
      await customObjectivesApi.yearGroups.update(id, { is_locked: newLockStatus });
      setMessage({ 
        type: 'success', 
        text: `Year group ${newLockStatus ? 'locked' : 'unlocked'} successfully` 
      });
      await loadData();
    } catch (error) {
      console.error('Failed to toggle lock status:', error);
      setMessage({ type: 'error', text: 'Failed to update lock status' });
    }
  };

  const handleCloneYearGroup = async () => {
    try {
      await customObjectivesApi.bulkOperations.cloneYearGroup(
        cloneData.sourceId,
        cloneData.targetName,
        cloneData.targetColor
      );
      setMessage({ type: 'success', text: 'Year group cloned successfully' });
      setShowCloneDialog(false);
      await loadData();
    } catch (error) {
      console.error('Failed to clone year group:', error);
      setMessage({ type: 'error', text: 'Failed to clone year group' });
    }
  };

  const handleExportCSV = async (yearGroupId?: string) => {
    try {
      const csvData = await customObjectivesApi.bulkOperations.exportToCSV(yearGroupId);
      
      // Convert to CSV string
      const headers = [
        'year_group',
        'year_group_description', 
        'year_group_color',
        'area',
        'area_description',
        'objective_text',
        'objective_description'
      ];
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof CustomObjectiveCSVRow] || ''}"`).join(','))
      ].join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `custom-objectives${yearGroupId ? `-${yearGroups.find(yg => yg.id === yearGroupId)?.name}` : ''}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'CSV exported successfully' });
    } catch (error) {
      console.error('Failed to export CSV:', error);
      setMessage({ type: 'error', text: 'Failed to export CSV' });
    }
  };

  const toggleAreaExpansion = (areaId: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedAreas(newExpanded);
  };

  const addArea = () => {
    setFormData(prev => ({
      ...prev,
      areas: [...prev.areas, { 
        section: '', // Add section field
        name: '', 
        description: '', 
        objectives: [{ 
          code: '',
          text: '', 
          description: '' 
        }] 
      }]
    }));
  };

  const removeArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.filter((_, i) => i !== index)
    }));
  };

  const addObjective = (areaIndex: number) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.map((area, index) => 
        index === areaIndex 
          ? { ...area, objectives: [...area.objectives, { 
              code: `OBJ${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              text: '', 
              description: '' 
            }] }
          : area
      )
    }));
  };

  const removeObjective = (areaIndex: number, objectiveIndex: number) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.map((area, index) => 
        index === areaIndex 
          ? { 
              ...area, 
              objectives: area.objectives.filter((_, i) => i !== objectiveIndex).length > 0 
                ? area.objectives.filter((_, i) => i !== objectiveIndex)
                : [{ 
                    code: `OBJ${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    text: '', 
                    description: '' 
                  }]
            }
          : area
      )
    }));
  };

  if (!isOpen && !embedded) return null;

  const content = (
    <>
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#4338E8] to-[#3529d1] text-white">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold">Custom Objectives Admin</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#E9E6FF] hover:text-white hover:bg-[#3529d1] rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

        {/* Message */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-current hover:opacity-70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content — narrow Subject Areas column + remaining width for objectives */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden min-[1024px]:flex-row">
          {/* Sidebar - Subject Areas List (fixed ~260px on desktop; stacks above on narrow) */}
          <div
            className={cn(
              'flex min-h-0 flex-col border-[#E2E0EF] bg-[#F7F6FB] transition-[width] duration-200',
              sidebarCollapsed
                ? 'w-full shrink-0 border-b min-[1024px]:w-12 min-[1024px]:border-b-0 min-[1024px]:border-r'
                : 'w-full shrink-0 border-b min-[1024px]:w-[260px] min-[1024px]:max-w-[280px] min-[1024px]:border-b-0 min-[1024px]:border-r',
            )}
          >
            <div className={cn('flex items-center gap-2 border-b border-[#E2E0EF] bg-white px-3 py-2.5', sidebarCollapsed && 'justify-center')}>
              {!sidebarCollapsed ? (
                <>
                  <h3 className="min-w-0 flex-1 truncate text-[15px] font-extrabold text-[#1F1B4D]">
                    Subject Areas
                  </h3>
                  <button
                    type="button"
                    onClick={handleCreateYearGroup}
                    className="rounded-lg bg-[#4338E8] p-2 text-white hover:bg-[#3529d1]"
                    title="Create New Subject Area"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCSV()}
                    className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700"
                    title="Export All to CSV"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="rounded-lg border border-[#E2E0EF] bg-white p-2 text-[#5F5B7A] hover:border-[#bcb7f4] hover:text-[#4338E8]"
                title={sidebarCollapsed ? 'Show Subject Areas' : 'Hide Subject Areas'}
                aria-expanded={!sidebarCollapsed}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </div>

            {!sidebarCollapsed ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              
              {/* Quick Add Reception Drama Button */}
              {!yearGroups.some(yg => yg.name === 'Reception Drama') && (
                <button
                  onClick={async () => {
                    try {
                      setMessage({ type: 'success', text: 'Adding Reception Drama objectives...' });
                      await seedReceptionDramaObjectives();
                      await loadData();
                      setMessage({ type: 'success', text: 'Reception Drama objectives added successfully!' });
                    } catch (error) {
                      setMessage({ type: 'error', text: 'Failed to add Reception Drama objectives' });
                    }
                  }}
                  className="w-full mb-4 p-3 bg-purple-100 border-2 border-dashed border-purple-300 text-purple-700 rounded-lg hover:bg-purple-200 hover:border-purple-400 transition-colors duration-200 text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <span>🎭</span>
                  <span>Add Reception Drama Objectives</span>
                </button>
              )}

              {/* Quick Add Dance (Reception–Year 6) Button */}
              {!yearGroups.some(yg => yg.name === 'Reception Dance') && (
                <button
                  onClick={async () => {
                    try {
                      setMessage({ type: 'success', text: 'Adding Dance (Reception–Year 6) objectives...' });
                      const { success } = await setupDanceObjectives();
                      await loadData();
                      setMessage({
                        type: success ? 'success' : 'error',
                        text: success
                          ? 'Dance objectives added successfully!'
                          : 'Some Dance objectives could not be added. Check console for details.'
                      });
                    } catch (error) {
                      setMessage({ type: 'error', text: 'Failed to add Dance objectives' });
                    }
                  }}
                  className="w-full mb-4 p-3 bg-indigo-100 border-2 border-dashed border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-200 hover:border-indigo-400 transition-colors duration-200 text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <span>💃</span>
                  <span>Add Dance (Reception–Year 6)</span>
                </button>
              )}

              {/* Quick Add Secondary Drama (Year 7–11) Button */}
              {!yearGroups.some(yg => yg.name === 'Year 7 Drama') && (
                <button
                  onClick={async () => {
                    try {
                      setMessage({ type: 'success', text: 'Adding Secondary Drama (Year 7–11) objectives...' });
                      const { success } = await setupSecondaryDramaObjectives();
                      await loadData();
                      setMessage({
                        type: success ? 'success' : 'error',
                        text: success
                          ? 'Secondary Drama (Year 7–11) objectives added successfully!'
                          : 'Some Secondary Drama objectives could not be added. Check console for details.'
                      });
                    } catch (error) {
                      setMessage({ type: 'error', text: 'Failed to add Secondary Drama objectives' });
                    }
                  }}
                  className="w-full mb-4 p-3 bg-violet-100 border-2 border-dashed border-violet-300 text-violet-700 rounded-lg hover:bg-violet-200 hover:border-violet-400 transition-colors duration-200 text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <span>🎭</span>
                  <span>Add Secondary Drama (Year 7–11)</span>
                </button>
              )}

              {loading ? (
                <div className="py-8 text-center text-[13px] text-[#5F5B7A]">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {objectiveFolders.map((ksFolder) => (
                    <div key={ksFolder.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleCollapsedId(setCollapsedSectionIds, ksFolder.id)}
                        className="flex w-full items-center justify-between rounded-lg border border-[#E2E0EF] bg-white px-2.5 py-2 text-left hover:border-[#bcb7f4]"
                      >
                        <div className="flex min-w-0 items-center gap-1.5">
                          {collapsedSectionIds.has(ksFolder.id) ? (
                            <ChevronRight className="h-4 w-4 shrink-0 text-[#77738F]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-[#77738F]" />
                          )}
                          <span className="truncate text-[13px] font-extrabold text-[#1F1B4D]">
                            {ksFolder.label}
                          </span>
                        </div>
                        <span className="shrink-0 text-[13px] font-semibold text-[#77738F]">
                          ({ksFolder.itemCount})
                        </span>
                      </button>

                      {!collapsedSectionIds.has(ksFolder.id) && (
                        <div className="space-y-1 pl-2">
                          {ksFolder.subjects.map((subjectFolder) => (
                            <div key={subjectFolder.id} className="space-y-1">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleCollapsedId(setCollapsedSubjectFolderIds, subjectFolder.id)
                                }
                                className="flex w-full items-center justify-between rounded-md border border-transparent bg-[#EFEDFF]/60 px-2 py-1.5 text-left hover:border-[#bcb7f4]"
                              >
                                <div className="flex min-w-0 items-center gap-1.5">
                                  {collapsedSubjectFolderIds.has(subjectFolder.id) ? (
                                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#77738F]" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#77738F]" />
                                  )}
                                  <span className="truncate text-[13px] font-bold text-[#4338E8]">
                                    {subjectFolder.label}
                                  </span>
                                </div>
                                <span className="shrink-0 text-[13px] font-medium text-[#77738F]">
                                  ({subjectFolder.items.length})
                                </span>
                              </button>

                              {!collapsedSubjectFolderIds.has(subjectFolder.id) && (
                                <div className="space-y-1.5 pl-1">
                                  {subjectFolder.items.map((yearGroup) => {
                                    const index = yearGroupIndexById.get(yearGroup.id);
                                    if (typeof index !== 'number') return null;
                                    return (
                                      <DraggableYearGroup
                                        key={yearGroup.id}
                                        yearGroup={yearGroup}
                                        index={index}
                                        isSelected={selectedYearGroup === yearGroup.id}
                                        onSelect={() => setSelectedYearGroup(yearGroup.id)}
                                        onReorder={(dragIndex, hoverIndex) => {
                                          const newYearGroups = [...yearGroups];
                                          const [removed] = newYearGroups.splice(dragIndex, 1);
                                          newYearGroups.splice(hoverIndex, 0, removed);
                                          newYearGroups.forEach((yg, i) => {
                                            yg.sort_order = i;
                                          });
                                          setYearGroups(newYearGroups);
                                          (async () => {
                                            try {
                                              for (const yg of newYearGroups) {
                                                await customObjectivesApi.yearGroups.update(yg.id, {
                                                  sort_order: yg.sort_order,
                                                });
                                              }
                                              setMessage({
                                                type: 'success',
                                                text: 'Subject areas reordered successfully',
                                              });
                                            } catch (error) {
                                              console.error('Failed to save order:', error);
                                              setMessage({
                                                type: 'error',
                                                text: 'Failed to save new order',
                                              });
                                            }
                                          })();
                                        }}
                                        onDragEnd={() => {}}
                                      >
                                        <div
                                          className={cn(
                                            'cursor-grab overflow-hidden rounded-lg border p-2.5 transition-colors active:cursor-grabbing',
                                            selectedYearGroup === yearGroup.id
                                              ? 'border-[#4338E8] bg-[#E9E6FF]'
                                              : 'border-[#E2E0EF] bg-white hover:border-[#bcb7f4]',
                                          )}
                                          onClick={() => setSelectedYearGroup(yearGroup.id)}
                                        >
                                          <div className="flex min-w-0 items-start justify-between gap-1.5">
                                            <div className="flex min-w-0 flex-1 items-start gap-1.5 overflow-hidden">
                                              <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#77738F]" />
                                              <div
                                                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                                                style={{ backgroundColor: yearGroup.color }}
                                              />
                                              <div className="min-w-0 flex-1 overflow-hidden">
                                                <div className="flex min-w-0 items-center gap-1">
                                                  <h4
                                                    className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#1F1B4D]"
                                                    title={yearGroup.name}
                                                  >
                                                    {yearGroup.name}
                                                  </h4>
                                                  {yearGroup.is_locked ? (
                                                    <Lock className="h-3 w-3 shrink-0 text-amber-500" />
                                                  ) : null}
                                                  {yearGroup.linked_year_groups &&
                                                  yearGroup.linked_year_groups.length > 0 ? (
                                                    <Link2 className="h-3 w-3 shrink-0 text-[#4338E8]" />
                                                  ) : null}
                                                </div>
                                                <p className="truncate text-[13px] text-[#77738F]">
                                                  {yearGroup.areas.length} areas,{' '}
                                                  {yearGroup.areas.reduce(
                                                    (sum, area) => sum + area.objectives.length,
                                                    0,
                                                  )}{' '}
                                                  objectives
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex shrink-0 gap-0.5">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setCloneData({
                                                    sourceId: yearGroup.id,
                                                    targetName: `${yearGroup.name} Copy`,
                                                    targetColor: yearGroup.color,
                                                  });
                                                  setShowCloneDialog(true);
                                                }}
                                                className="p-1 text-[#77738F] hover:text-[#1F1B4D]"
                                                title="Clone"
                                              >
                                                <Copy className="h-3 w-3" />
                                              </button>
                                              {isAdmin ? (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleLock(yearGroup.id);
                                                  }}
                                                  className={cn(
                                                    'p-1',
                                                    yearGroup.is_locked
                                                      ? 'text-amber-500 hover:text-amber-600'
                                                      : 'text-[#77738F] hover:text-[#1F1B4D]',
                                                  )}
                                                  title={
                                                    yearGroup.is_locked
                                                      ? 'Unlock (Admin only)'
                                                      : 'Lock (Admin only)'
                                                  }
                                                >
                                                  {yearGroup.is_locked ? (
                                                    <Lock className="h-3 w-3" />
                                                  ) : (
                                                    <Unlock className="h-3 w-3" />
                                                  )}
                                                </button>
                                              ) : null}
                                              {!yearGroup.is_locked ? (
                                                <>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleEditYearGroup(yearGroup);
                                                    }}
                                                    className="p-1 text-[#77738F] hover:text-[#1F1B4D]"
                                                    title="Edit"
                                                  >
                                                    <Edit2 className="h-3 w-3" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDeleteYearGroup(yearGroup.id);
                                                    }}
                                                    className="p-1 text-[#77738F] hover:text-red-600"
                                                    title="Delete"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </button>
                                                </>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                      </DraggableYearGroup>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            ) : null}
          </div>

          {/* Main Content - Areas and Objectives (takes remaining width; min-w-0 prevents clip) */}
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-white">
            {selectedYearGroup ? (
              <div className="w-full max-w-none p-4 sm:p-6">
                {(() => {
                  const yearGroup = yearGroups.find((yg) => yg.id === selectedYearGroup);
                  if (!yearGroup) return null;

                  return (
                    <div className="w-full min-w-0">
                      <div className="mb-5">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <div
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: yearGroup.color }}
                            />
                            <h3 className="truncate text-lg font-extrabold text-[#1F1B4D]">
                              {yearGroup.name}
                            </h3>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => handleExportCSV(yearGroup.id)}
                              className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1.5 text-[13px] font-bold text-white hover:bg-green-700"
                              title="Export to CSV"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Export CSV</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditYearGroup(yearGroup)}
                              className="inline-flex items-center gap-1 rounded-md bg-[#4338E8] px-2.5 py-1.5 text-[13px] font-bold text-white hover:bg-[#3529d1]"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                          </div>
                        </div>
                        {yearGroup.description ? (
                          <p className="text-[13px] italic text-[#5F5B7A]">{yearGroup.description}</p>
                        ) : null}
                      </div>

                      <div className="w-full min-w-0 space-y-3">
                        {(() => {
                          const groupedBySection: Record<string, typeof yearGroup.areas> = {};
                          yearGroup.areas.forEach((area) => {
                            const section = area.section || 'Other';
                            if (!groupedBySection[section]) groupedBySection[section] = [];
                            groupedBySection[section].push(area);
                          });

                          return Object.entries(groupedBySection).map(([section, areas]) => {
                            const sectionKey = `${yearGroup.id}::${section}`;
                            const sectionOpen =
                              section === 'Other' || expandedContentSections.has(sectionKey);
                            const objectiveCount = areas.reduce(
                              (n, a) => n + a.objectives.length,
                              0,
                            );

                            return (
                              <div key={section} className="w-full min-w-0 space-y-2">
                                {section !== 'Other' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExpandedContentSections((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(sectionKey)) next.delete(sectionKey);
                                        else next.add(sectionKey);
                                        return next;
                                      });
                                    }}
                                    className="flex w-full items-center justify-between gap-3 rounded-lg border-l-4 border-[#4338E8] bg-gradient-to-r from-[#E9E6FF] to-blue-50 px-4 py-3 text-left hover:from-[#E0DCFF]"
                                  >
                                    <div className="flex min-w-0 items-center gap-2">
                                      {sectionOpen ? (
                                        <ChevronDown className="h-5 w-5 shrink-0 text-[#4338E8]" />
                                      ) : (
                                        <ChevronRight className="h-5 w-5 shrink-0 text-[#4338E8]" />
                                      )}
                                      <h3 className="min-w-0 text-[15px] font-extrabold text-[#1F1B4D]">
                                        {section}
                                      </h3>
                                    </div>
                                    <span className="shrink-0 text-[13px] font-semibold text-[#4338E8]">
                                      {areas.length} strands · {objectiveCount} objectives
                                    </span>
                                  </button>
                                ) : null}

                                {sectionOpen
                                  ? areas.map((area) => (
                                      <div
                                        key={area.id}
                                        className="w-full min-w-0 overflow-hidden rounded-lg border border-[#E2E0EF] hover:border-[#bcb7f4]"
                                      >
                                        <button
                                          type="button"
                                          className="flex w-full items-center justify-between gap-3 bg-gradient-to-r from-gray-50 to-white p-4 text-left hover:from-[#E9E6FF] hover:to-blue-50"
                                          onClick={() => toggleAreaExpansion(area.id)}
                                        >
                                          <div className="min-w-0 flex-1">
                                            <h4 className="text-[15px] font-bold text-[#1F1B4D]">
                                              {area.name}
                                            </h4>
                                            {area.description ? (
                                              <p className="mt-1 text-[13px] text-[#5F5B7A]">
                                                {area.description}
                                              </p>
                                            ) : null}
                                            <p className="mt-1 text-[13px] font-semibold text-[#4338E8]">
                                              {area.objectives.length} objectives
                                            </p>
                                          </div>
                                          {expandedAreas.has(area.id) ? (
                                            <ChevronDown className="h-5 w-5 shrink-0 text-[#4338E8]" />
                                          ) : (
                                            <ChevronRight className="h-5 w-5 shrink-0 text-[#77738F]" />
                                          )}
                                        </button>

                                        {expandedAreas.has(area.id) ? (
                                          <div className="border-t border-[#E2E0EF] bg-white p-4">
                                            <div className="space-y-2">
                                              {area.objectives.map((objective, idx) => (
                                                <div
                                                  key={objective.id}
                                                  className="flex w-full min-w-0 items-start gap-3 rounded-lg border border-[#E2E0EF] bg-gradient-to-r from-[#E9E6FF] to-blue-50 p-3"
                                                >
                                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4338E8] text-[13px] font-bold text-white">
                                                    {idx + 1}
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] leading-relaxed text-[#1F1B4D]">
                                                      {objective.objective_text}
                                                    </p>
                                                    {objective.description ? (
                                                      <p className="mt-1 text-[13px] text-[#5F5B7A]">
                                                        {objective.description}
                                                      </p>
                                                    ) : null}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>
                                    ))
                                  : null}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-[13px] text-[#5F5B7A]">
                Select a year group to view its objectives
              </div>
            )}
          </div>
        </div>

        {/* Clone Dialog */}
        {showCloneDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[75]">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Clone Year Group</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Name
                  </label>
                  <input
                    type="text"
                    value={cloneData.targetName}
                    onChange={(e) => setCloneData(prev => ({ ...prev, targetName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4338E8] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={cloneData.targetColor}
                    onChange={(e) => setCloneData(prev => ({ ...prev, targetColor: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowCloneDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloneYearGroup}
                  className="px-4 py-2 bg-[#4338E8] text-white rounded-md hover:bg-[#3529d1]"
                >
                  Clone
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Dialog */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[75]">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              {/* Header with close button */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#4338E8] to-[#3529d1] text-white">
                <h3 className="text-lg font-semibold">
                  {editingYearGroup ? 'Edit Main Heading (Subject Area)' : 'Create New Main Heading (Subject Area)'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingYearGroup(null);
                    setSaveStatus('idle');
                  }}
                  className="p-2 text-[#E9E6FF] hover:text-white hover:bg-[#3529d1] rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Save Status Message */}
              {saveStatus !== 'idle' && (
                <div className={`mx-6 mt-4 p-4 rounded-lg shadow-md transition-all duration-300 ${
                  saveStatus === 'success' ? 'bg-[#E9E6FF] border border-[#E2E0EF]' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {saveStatus === 'success' ? (
                      <>
                        <div className="flex-shrink-0 w-10 h-10 bg-[#E9E6FF] rounded-full flex items-center justify-center">
                          <Check className="h-6 w-6 text-[#4338E8]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-[#1F1B4D]">
                            {editingYearGroup ? 'Subject area updated successfully!' : 'Subject area created successfully!'}
                          </h3>
                          <p className="text-sm text-[#4338E8]">
                            {editingYearGroup ? 'Your changes have been saved.' : 'Your new subject area has been created.'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-red-800">Failed to save</h3>
                          <p className="text-sm text-red-600">Please check the form and try again.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                {/* Main Heading Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Area Name *
                    </label>
                    <input
                      type="text"
                      value={formData.year_group.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        year_group: { ...prev.year_group, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4338E8] focus:border-transparent"
                      placeholder="e.g., Communication and Language, Mathematics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="color"
                      value={formData.year_group.color}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        year_group: { ...prev.year_group, color: e.target.value }
                      }))}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.year_group.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      year_group: { ...prev.year_group, description: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4338E8] focus:border-transparent"
                    rows={2}
                    placeholder="Brief description of this subject area (e.g., age group, context)"
                  />
                </div>

                {/* Linked Year Groups */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center space-x-2">
                      <Link2 className="h-4 w-4 text-[#4338E8]" />
                      <span>Link to Year Groups</span>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Select which year groups these objectives apply to. If none selected, objectives will be available to all year groups.
                  </p>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {availableYearGroups.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No year groups configured in Settings</p>
                    ) : (
                      availableYearGroups.map((ygName) => {
                        const isLinked = formData.year_group.linked_year_groups?.includes(ygName) || false;
                        return (
                          <button
                            key={ygName}
                            type="button"
                            onClick={() => {
                              const currentLinked = formData.year_group.linked_year_groups || [];
                              const newLinked = isLinked
                                ? currentLinked.filter(yg => yg !== ygName)
                                : [...currentLinked, ygName];
                              setFormData(prev => ({
                                ...prev,
                                year_group: { ...prev.year_group, linked_year_groups: newLinked }
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center space-x-1.5 ${
                              isLinked
                                ? 'bg-[#4338E8] text-white ring-2 ring-[#a9a3ff]'
                                : 'bg-white text-gray-700 border border-gray-300 hover:border-[#bcb7f4] hover:bg-[#E9E6FF]'
                            }`}
                          >
                            {isLinked && <Check className="h-3 w-3" />}
                            <span>{ygName}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                  {(formData.year_group.linked_year_groups?.length || 0) > 0 && (
                    <p className="text-xs text-[#4338E8] mt-1">
                      Linked to {formData.year_group.linked_year_groups?.length} year group{formData.year_group.linked_year_groups?.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Subheadings */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-900">Subheadings (Focus Areas)</h4>
                    <button
                      onClick={addArea}
                      className="px-3 py-1 bg-[#4338E8] text-white text-sm rounded-md hover:bg-[#3529d1]"
                    >
                      Add Subheading
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.areas.map((area, areaIndex) => (
                      <div key={areaIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">Subheading {areaIndex + 1}</h5>
                          <button
                            onClick={() => removeArea(areaIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Section (Optional)
                            </label>
                            <input
                              type="text"
                              value={area.section || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                areas: prev.areas.map((a, i) => 
                                  i === areaIndex ? { ...a, section: e.target.value } : a
                                )
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4338E8] focus:border-transparent"
                              placeholder="e.g., Communication and Language, Physical Development"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              💡 Overall section that groups multiple subheadings together
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Subheading *
                            </label>
                            <input
                              type="text"
                              value={area.name}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                areas: prev.areas.map((a, i) => 
                                  i === areaIndex ? { ...a, name: e.target.value } : a
                                )
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4338E8] focus:border-transparent"
                              placeholder="e.g., Listening, Attention and Understanding"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              💡 Specific subheading under the section (if you entered one above)
                            </p>
                          </div>
                        </div>

                        {/* Objectives */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h6 className="text-sm font-medium text-gray-700">Objectives</h6>
                          </div>
                          
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Objectives *
                            </label>
                            <textarea
                              value={area.objectives.length === 1 ? area.objectives[0].text : area.objectives.map(obj => obj.text).join('\n')}
                              onChange={(e) => {
                                autoResizeTextarea(e.target);
                                handleObjectiveTextChange(areaIndex, 0, e.target.value);
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4338E8] focus:border-transparent resize-none overflow-hidden"
                              rows={Math.max(3, area.objectives.length)}
                              placeholder="Enter objectives here. Press Enter after each objective to separate them:&#10;&#10;Objective 1 text&#10;Objective 2 text&#10;Objective 3 text&#10;&#10;Or use # to separate:&#10;Objective 1 # Objective 2 # Objective 3"
                              style={{ minHeight: '5rem' }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              💡 Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Enter</kbd> after each objective to auto-separate, or use <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">#</kbd> as a delimiter.
                            </p>
                          </div>
                          
                          {area.objectives.length > 1 && (
                            <div className="space-y-2 mb-4">
                              <p className="text-sm font-medium text-gray-700">Parsed Objectives:</p>
                              {area.objectives.map((objective, objectiveIndex) => (
                                <div key={objectiveIndex} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="text-sm text-gray-800 font-medium mb-1">
                                        Objective {objectiveIndex + 1}
                                      </div>
                                      <div className="text-sm text-gray-700">
                                        {objective.text}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const remainingObjectives = area.objectives.filter((_, idx) => idx !== objectiveIndex);
                                        setFormData(prev => ({
                                          ...prev,
                                          areas: prev.areas.map((a, i) => 
                                            i === areaIndex ? {
                                              ...a,
                                              objectives: remainingObjectives.length > 0 ? remainingObjectives : [{ 
                                                code: `OBJ${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                                                text: '', 
                                                description: '' 
                                              }]
                                            } : a
                                          )
                                        }));
                                      }}
                                      className="text-red-600 hover:text-red-800 p-1 ml-2"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>

              {/* Footer buttons - fixed at bottom */}
              <div className="flex justify-end space-x-2 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingYearGroup(null);
                    setSaveStatus('idle');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveYearGroup}
                  disabled={!formData.year_group.name || formData.areas.length === 0}
                  className="px-4 py-2 bg-[#4338E8] text-white rounded-md hover:bg-[#3529d1] disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {editingYearGroup ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );

  // Embedded mode — fill the Settings pane (independent scroll in each column)
  if (embedded) {
    return (
      <div className="ss-objectives-admin bg-white rounded-xl border border-[#E2E0EF] shadow-sm flex flex-col overflow-hidden min-h-0 flex-1 h-full">
        {content}
      </div>
    );
  }

  // Modal mode
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {content}
      </div>
    </div>
  );
}
