import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Download, RotateCcw, Type, Settings, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Bold, Italic, Plus, Minus, Lock, Eye, EyeOff, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface TextFieldConfig {
  id: string;
  label: string;
  defaultValue: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  color: string;
  maxWidth?: number;
  visible?: boolean;
  textAlign?: 'left' | 'center' | 'right';
}

interface PlainBoardVariant {
  color: 'black' | 'active-red' | 'warm-grey' | 'dark-grey';
  size: 'normal' | 'narrow';
}

interface LayoutTemplate {
  id: string;
  name: string;
  cleanImage: string;
  previewImage: string;
  textFields: TextFieldConfig[];
  isPlainBoard?: boolean;
  plainBoardVariant?: PlainBoardVariant;
}

interface TextFieldValue {
  [key: string]: string;
}

// Plain Board color configurations
const plainBoardColors = {
  'black': { bg: '#000000', textColor: '#FFFFFF', label: 'Black' },
  'active-red': { bg: '#F43F3F', textColor: '#FFFFFF', label: 'Active Red' },
  'warm-grey': { bg: '#E8E4DF', textColor: '#000000', label: 'Warm Grey' },
  'dark-grey': { bg: '#6B6B6B', textColor: '#FFFFFF', label: 'Dark Grey' },
};

const plainBoardImages: Record<string, Record<string, string>> = {
  'black': {
    'normal': '/lovable-uploads/plain-board-black.png',
    'narrow': '/lovable-uploads/plain-board-black-narrow.png',
  },
  'active-red': {
    'normal': '/lovable-uploads/plain-board-active-red.png',
    'narrow': '/lovable-uploads/plain-board-active-red-narrow.png',
  },
  'warm-grey': {
    'normal': '/lovable-uploads/plain-board-warm-grey.png',
    'narrow': '/lovable-uploads/plain-board-warm-grey-narrow.png',
  },
  'dark-grey': {
    'normal': '/lovable-uploads/plain-board-dark-grey.png',
    'narrow': '/lovable-uploads/plain-board-dark-grey-narrow.png',
  },
};

const getPlainBoardTemplate = (color: string, size: string): LayoutTemplate => {
  const colorConfig = plainBoardColors[color as keyof typeof plainBoardColors];
  return {
    id: `plain-board-${color}-${size}`,
    name: `Plain Board - ${colorConfig.label} (${size === 'narrow' ? 'Narrow' : 'Normal'})`,
    cleanImage: plainBoardImages[color][size],
    previewImage: plainBoardImages[color][size],
    isPlainBoard: true,
    plainBoardVariant: { color: color as PlainBoardVariant['color'], size: size as PlainBoardVariant['size'] },
    textFields: [
      {
        id: 'text1',
        label: 'Text 1',
        defaultValue: 'Text Line 1',
        x: 20,
        y: size === 'narrow' ? 30 : 60,
        fontSize: size === 'narrow' ? 16 : 24,
        fontWeight: '400',
        fontStyle: 'normal',
        color: colorConfig.textColor,
        maxWidth: 360,
        visible: true,
        textAlign: 'left',
      },
      {
        id: 'text2',
        label: 'Text 2',
        defaultValue: 'Text Line 2',
        x: 20,
        y: size === 'narrow' ? 55 : 100,
        fontSize: size === 'narrow' ? 14 : 20,
        fontWeight: '400',
        fontStyle: 'normal',
        color: colorConfig.textColor,
        maxWidth: 360,
        visible: true,
        textAlign: 'left',
      },
    ],
  };
};

const defaultLayoutTemplates: LayoutTemplate[] = [
  {
    id: 'coupon',
    name: 'Coupon',
    cleanImage: '/lovable-uploads/milo-coupon-clean.png',
    previewImage: '/lovable-uploads/milo-coupon-20.png',
    textFields: [
      {
        id: 'headline',
        label: 'Headline',
        defaultValue: 'Exclusive Discount\nfor you',
        x: 55,
        y: 75,
        fontSize: 18,
        fontWeight: '500',
        fontStyle: 'italic',
        color: '#FFFFFF',
        maxWidth: 320,
        visible: true,
      },
      {
        id: 'discount',
        label: 'Discount Amount',
        defaultValue: '20% OFF',
        x: 55,
        y: 145,
        fontSize: 42,
        fontWeight: '700',
        fontStyle: 'normal',
        color: '#FFFFFF',
        maxWidth: 320,
        visible: true,
      },
    ],
  },
  {
    id: 'plain-board',
    name: 'Plain Board',
    cleanImage: '/lovable-uploads/plain-board-black.png',
    previewImage: '/lovable-uploads/plain-board-black.png',
    isPlainBoard: true,
    plainBoardVariant: { color: 'black', size: 'normal' },
    textFields: [
      {
        id: 'text1',
        label: 'Text 1',
        defaultValue: 'Text Line 1',
        x: 20,
        y: 60,
        fontSize: 24,
        fontWeight: '400',
        fontStyle: 'normal',
        color: '#FFFFFF',
        maxWidth: 360,
        visible: true,
        textAlign: 'left',
      },
      {
        id: 'text2',
        label: 'Text 2',
        defaultValue: 'Text Line 2',
        x: 20,
        y: 100,
        fontSize: 20,
        fontWeight: '400',
        fontStyle: 'normal',
        color: '#FFFFFF',
        maxWidth: 360,
        visible: true,
        textAlign: 'left',
      },
    ],
  },
];

const STORAGE_KEY = 'milo-layout-templates';
const TEXT_VALUES_STORAGE_KEY = 'milo-text-values';
const ADMIN_PASSWORD = '1010';

// Removed fields (kept here to auto-migrate any previously saved templates)
const DISABLED_FIELD_IDS = new Set(['subheadline', 'discountLabel']);

const normalizeLayoutTemplate = (savedTemplate: LayoutTemplate): LayoutTemplate => {
  // Filter out disabled fields
  const filteredFields = (savedTemplate.textFields || []).filter((f) => !DISABLED_FIELD_IDS.has(f.id));
  
  return {
    ...savedTemplate,
    textFields: filteredFields,
  };
};

const mergeWithDefaults = (savedTemplates: LayoutTemplate[]): LayoutTemplate[] => {
  // Create a map of saved templates by id
  const savedMap = new Map(savedTemplates.map(t => [t.id, t]));
  
  // Merge: use saved template if exists (preserving admin changes), otherwise use default
  return defaultLayoutTemplates.map(defaultT => {
    const saved = savedMap.get(defaultT.id);
    if (saved) {
      // Use saved template but ensure disabled fields are removed
      return normalizeLayoutTemplate(saved);
    }
    return normalizeLayoutTemplate(defaultT);
  });
};

const normalizeTemplates = (templates: unknown): LayoutTemplate[] => {
  if (!Array.isArray(templates)) return defaultLayoutTemplates.map(t => normalizeLayoutTemplate(t));
  return mergeWithDefaults(templates as LayoutTemplate[]);
};

const MiloECRM: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLayout, setSelectedLayout] = useState<LayoutTemplate | null>(null);
  const [textValues, setTextValues] = useState<TextFieldValue>(() => {
    const saved = localStorage.getItem(TEXT_VALUES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Admin mode states
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Load templates from localStorage or use defaults
  const [layoutTemplates, setLayoutTemplates] = useState<LayoutTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return normalizeTemplates(JSON.parse(saved));
      } catch {
        return defaultLayoutTemplates.map(normalizeLayoutTemplate);
      }
    }
    return defaultLayoutTemplates.map(normalizeLayoutTemplate);
  });

  // Save templates to localStorage
  const saveTemplates = (templates: LayoutTemplate[]) => {
    const normalized = normalizeTemplates(templates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setLayoutTemplates(normalized);
  };

  const handleLayoutSelect = (layout: LayoutTemplate) => {
    // Find the saved template from layoutTemplates (which includes localStorage data)
    const savedTemplate = layoutTemplates.find(t => t.id === layout.id);
    const templateToUse = savedTemplate ? normalizeLayoutTemplate(savedTemplate) : normalizeLayoutTemplate(layout);
    
    setSelectedLayout(templateToUse);
    
    // Load saved text values, fallback to defaults
    const savedTextValues = localStorage.getItem(TEXT_VALUES_STORAGE_KEY);
    let savedValues: TextFieldValue = {};
    if (savedTextValues) {
      try {
        savedValues = JSON.parse(savedTextValues);
      } catch {
        savedValues = {};
      }
    }
    
    // Use saved values if exist, otherwise use defaults from template
    const initialValues: TextFieldValue = {};
    templateToUse.textFields.forEach(field => {
      // Use saved value if exists, otherwise use template default
      initialValues[field.id] = savedValues[field.id] !== undefined ? savedValues[field.id] : field.defaultValue;
    });
    setTextValues(initialValues);
    setSelectedFieldId(null);
  };

  const handleTextChange = (fieldId: string, value: string) => {
    setTextValues(prev => {
      const newValues = {
        ...prev,
        [fieldId]: value,
      };
      // Save to localStorage
      localStorage.setItem(TEXT_VALUES_STORAGE_KEY, JSON.stringify(newValues));
      return newValues;
    });
  };

  const handleReset = () => {
    if (!selectedLayout) return;
    const initialValues: TextFieldValue = {};
    selectedLayout.textFields.forEach(field => {
      initialValues[field.id] = field.defaultValue;
    });
    setTextValues(initialValues);
    // Also update localStorage
    localStorage.setItem(TEXT_VALUES_STORAGE_KEY, JSON.stringify(initialValues));
  };

  const handleDownload = useCallback(async () => {
    if (!selectedLayout || !canvasRef.current) return;
    
    setIsDownloading(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = selectedLayout.cleanImage;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const previewWidth = 400;
      const scaleX = img.width / previewWidth;
      const scaleY = img.height / (previewWidth * (img.height / img.width));

      selectedLayout.textFields.forEach(field => {
        // Skip hidden fields
        if (field.visible === false) return;
        
        const text = textValues[field.id] || field.defaultValue;
        ctx.font = `${field.fontStyle} ${field.fontWeight} ${field.fontSize * scaleX}px "LG EI Text", sans-serif`;
        ctx.fillStyle = field.color;
        ctx.textBaseline = 'middle';
        
        // Calculate x position based on text alignment
        let xPos = field.x * scaleX;
        const fieldWidth = (field.maxWidth || 360) * scaleX;
        
        if (field.textAlign === 'center') {
          ctx.textAlign = 'center';
          xPos = field.x * scaleX + fieldWidth / 2;
        } else if (field.textAlign === 'right') {
          ctx.textAlign = 'right';
          xPos = field.x * scaleX + fieldWidth;
        } else {
          ctx.textAlign = 'left';
        }
        
        ctx.fillText(text, xPos, field.y * scaleY);
      });

      const link = document.createElement('a');
      link.download = `milo-${selectedLayout.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedLayout, textValues]);

  const handleBack = () => {
    if (selectedLayout) {
      setSelectedLayout(null);
      setTextValues({});
      setSelectedFieldId(null);
    } else {
      navigate('/');
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdminMode(true);
      setShowPasswordDialog(false);
      setPasswordInput('');
      toast({
        title: "Admin Mode Enabled",
        description: "You can now adjust text positions and styles.",
      });
    } else {
      toast({
        title: "Incorrect Password",
        description: "Please try again.",
        variant: "destructive",
      });
      setPasswordInput('');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
    setSelectedFieldId(null);
    toast({
      title: "Admin Mode Disabled",
      description: "Changes have been saved.",
    });
  };

  // Admin functions to update field properties
  const updateFieldProperty = (fieldId: string, property: keyof TextFieldConfig, value: number | string | boolean) => {
    if (!selectedLayout) return;

    const updatedTextFields = selectedLayout.textFields.map(field =>
      field.id === fieldId ? { ...field, [property]: value } : field
    );

    const updatedLayout = { ...selectedLayout, textFields: updatedTextFields };
    setSelectedLayout(updatedLayout);

    // Update in templates
    const updatedTemplates = layoutTemplates.map(t =>
      t.id === selectedLayout.id ? updatedLayout : t
    );
    saveTemplates(updatedTemplates);
  };

  // Toggle field visibility
  const toggleFieldVisibility = (fieldId: string) => {
    const field = selectedLayout?.textFields.find(f => f.id === fieldId);
    if (!field) return;
    updateFieldProperty(fieldId, 'visible', !(field.visible !== false));
  };

  // Change Plain Board variant (color/size)
  const changePlainBoardVariant = (color: string, size: string) => {
    if (!selectedLayout?.isPlainBoard) return;
    
    const newTemplate = getPlainBoardTemplate(color, size);
    // Preserve current text field settings from selected layout
    const preservedFields = newTemplate.textFields.map((newField, index) => {
      const existingField = selectedLayout.textFields[index];
      if (existingField) {
        return {
          ...newField,
          x: existingField.x,
          y: existingField.y,
          fontSize: existingField.fontSize,
          fontWeight: existingField.fontWeight,
          fontStyle: existingField.fontStyle,
          visible: existingField.visible,
          // Update color based on new background
          color: plainBoardColors[color as keyof typeof plainBoardColors].textColor,
        };
      }
      return newField;
    });
    
    const updatedLayout = { ...newTemplate, textFields: preservedFields };
    setSelectedLayout(updatedLayout);
    
    // Save to templates
    const existingIndex = layoutTemplates.findIndex(t => t.id === 'plain-board');
    if (existingIndex >= 0) {
      const updatedTemplates = [...layoutTemplates];
      updatedTemplates[existingIndex] = { ...updatedLayout, id: 'plain-board' };
      saveTemplates(updatedTemplates);
    }
  };

  // Change font weight with more options
  const changeFontWeight = (fieldId: string, weight: string) => {
    updateFieldProperty(fieldId, 'fontWeight', weight);
  };

  const moveField = (fieldId: string, direction: 'up' | 'down' | 'left' | 'right', step: number = 2) => {
    const field = selectedLayout?.textFields.find(f => f.id === fieldId);
    if (!field) return;

    switch (direction) {
      case 'up':
        updateFieldProperty(fieldId, 'y', field.y - step);
        break;
      case 'down':
        updateFieldProperty(fieldId, 'y', field.y + step);
        break;
      case 'left':
        updateFieldProperty(fieldId, 'x', field.x - step);
        break;
      case 'right':
        updateFieldProperty(fieldId, 'x', field.x + step);
        break;
    }
  };

  const changeFontSize = (fieldId: string, delta: number) => {
    const field = selectedLayout?.textFields.find(f => f.id === fieldId);
    if (!field) return;
    const newSize = Math.max(8, Math.min(72, field.fontSize + delta));
    updateFieldProperty(fieldId, 'fontSize', newSize);
  };

  const toggleBold = (fieldId: string) => {
    const field = selectedLayout?.textFields.find(f => f.id === fieldId);
    if (!field) return;
    const weights = ['300', '400', '500', '600', '700'];
    const currentIndex = weights.indexOf(field.fontWeight);
    const newWeight = field.fontWeight === '700' ? '400' : '700';
    updateFieldProperty(fieldId, 'fontWeight', newWeight);
  };

  const toggleItalic = (fieldId: string) => {
    const field = selectedLayout?.textFields.find(f => f.id === fieldId);
    if (!field) return;
    const newStyle = field.fontStyle === 'italic' ? 'normal' : 'italic';
    updateFieldProperty(fieldId, 'fontStyle', newStyle);
  };

  const getSelectedField = () => {
    if (!selectedFieldId || !selectedLayout) return null;
    return selectedLayout.textFields.find(f => f.id === selectedFieldId);
  };

  // Drag state for text fields
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragFieldStartPos, setDragFieldStartPos] = useState({ x: 0, y: 0 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    if (!isAdminMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedFieldId(fieldId);
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    
    const field = selectedLayout?.textFields.find(f => f.id === fieldId);
    if (field) {
      setDragFieldStartPos({ x: field.x, y: field.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedFieldId || !selectedLayout) return;
    
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;
    
    const newX = Math.max(0, dragFieldStartPos.x + deltaX);
    const newY = Math.max(0, dragFieldStartPos.y + deltaY);
    
    // Update position without saving to localStorage during drag
    const updatedTextFields = selectedLayout.textFields.map(field =>
      field.id === selectedFieldId ? { ...field, x: newX, y: newY } : field
    );
    setSelectedLayout({ ...selectedLayout, textFields: updatedTextFields });
  }, [isDragging, selectedFieldId, selectedLayout, dragStartPos, dragFieldStartPos]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && selectedFieldId && selectedLayout) {
      // Save to localStorage when drag ends
      const updatedTemplates = layoutTemplates.map(t =>
        t.id === selectedLayout.id ? selectedLayout : t
      );
      saveTemplates(updatedTemplates);
    }
    setIsDragging(false);
  }, [isDragging, selectedFieldId, selectedLayout, layoutTemplates]);

  // Global mouse events for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard arrow key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAdminMode || !selectedFieldId) return;
      
      // Don't interfere with input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const step = e.shiftKey ? 10 : 2; // Shift for larger steps
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveField(selectedFieldId, 'up', step);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveField(selectedFieldId, 'down', step);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveField(selectedFieldId, 'left', step);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveField(selectedFieldId, 'right', step);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminMode, selectedFieldId, moveField]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/milo-profile.png" 
                alt="Milo" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <h1 className="text-lg font-semibold text-foreground">Milo</h1>
                <p className="text-sm text-muted-foreground">eCRM Designer</p>
              </div>
            </div>
          </div>

          {/* Admin Button */}
          <div className="flex items-center gap-2">
            {isAdminMode ? (
              <Button variant="outline" size="sm" onClick={handleAdminLogout} className="gap-2">
                <Lock className="h-4 w-4" />
                Exit Admin
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setShowPasswordDialog(true)}>
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!selectedLayout ? (
          // Layout Selection View
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Select a Layout</h2>
              <p className="text-muted-foreground">Choose an email layout template to customize</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {layoutTemplates.map(layout => (
                <Card 
                  key={layout.id}
                  className="cursor-pointer hover:border-primary transition-colors group"
                  onClick={() => handleLayoutSelect(layout)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{layout.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {layout.textFields.length} editable fields
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={layout.previewImage} 
                        alt={layout.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Editor View
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Preview Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Preview</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleDownload} disabled={isDownloading}>
                    <Download className="h-4 w-4 mr-2" />
                    {isDownloading ? 'Downloading...' : 'Download PNG'}
                  </Button>
                </div>
              </div>

              {/* Live Preview */}
              <div className="relative bg-muted rounded-xl p-4 flex items-center justify-center">
                <div className="relative" style={{ width: '400px' }}>
                  <img 
                    src={selectedLayout.cleanImage} 
                    alt="Layout template"
                    className="w-full h-auto"
                  />
                  {/* Text Overlays */}
                  {selectedLayout.textFields.filter(field => field.visible !== false).map(field => (
                    <div
                      key={field.id}
                      className={`absolute whitespace-pre-wrap select-none ${
                        isAdminMode 
                          ? isDragging && selectedFieldId === field.id
                            ? 'cursor-grabbing'
                            : 'cursor-grab'
                          : 'cursor-default'
                      } ${
                        isAdminMode && selectedFieldId === field.id 
                          ? 'ring-2 ring-primary ring-offset-2' 
                          : ''
                      }`}
                      style={{
                        left: `${field.x}px`,
                        top: `${field.y}px`,
                        fontSize: `${field.fontSize}px`,
                        fontWeight: field.fontWeight,
                        fontStyle: field.fontStyle,
                        color: field.color,
                        width: field.maxWidth ? `${field.maxWidth}px` : undefined,
                        fontFamily: '"LG EI Text", sans-serif',
                        lineHeight: 1.3,
                        textAlign: field.textAlign || 'left',
                      }}
                      onClick={() => isAdminMode && setSelectedFieldId(field.id)}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                    >
                      {textValues[field.id] || field.defaultValue}
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Controls */}
              {isAdminMode && selectedFieldId && (
                <Card className="border-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Admin: {getSelectedField()?.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Position Controls */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Position</Label>
                      <div className="flex items-center justify-center gap-1">
                        <div className="grid grid-cols-3 gap-1">
                          <div />
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => moveField(selectedFieldId, 'up')}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <div />
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => moveField(selectedFieldId, 'left')}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="h-8 w-8 flex items-center justify-center text-xs text-muted-foreground">
                            {getSelectedField()?.x},{getSelectedField()?.y}
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => moveField(selectedFieldId, 'right')}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <div />
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => moveField(selectedFieldId, 'down')}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <div />
                        </div>
                      </div>
                    </div>

                    {/* Font Size Controls */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Font Size: {getSelectedField()?.fontSize}px</Label>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => changeFontSize(selectedFieldId, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 h-2 bg-muted rounded-full">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${((getSelectedField()?.fontSize || 16) / 72) * 100}%` }}
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => changeFontSize(selectedFieldId, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Style Controls */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Style</Label>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant={getSelectedField()?.fontWeight === '700' ? 'default' : 'outline'}
                          size="sm"
                          className="gap-2"
                          onClick={() => toggleBold(selectedFieldId)}
                        >
                          <Bold className="h-4 w-4" />
                          Bold
                        </Button>
                        <Button 
                          variant={getSelectedField()?.fontStyle === 'italic' ? 'default' : 'outline'}
                          size="sm"
                          className="gap-2"
                          onClick={() => toggleItalic(selectedFieldId)}
                        >
                          <Italic className="h-4 w-4" />
                          Italic
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isAdminMode && !selectedFieldId && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click on a text element above to edit its position and style
                </p>
              )}

              {/* Hidden Canvas for Download */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Editor Panel */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Edit Text</h2>
              </div>

              {/* Plain Board Controls */}
              {selectedLayout.isPlainBoard && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Board Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Color</Label>
                        <Select 
                          value={selectedLayout.plainBoardVariant?.color || 'black'}
                          onValueChange={(color) => changePlainBoardVariant(color, selectedLayout.plainBoardVariant?.size || 'normal')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="black">Black</SelectItem>
                            <SelectItem value="active-red">Active Red</SelectItem>
                            <SelectItem value="warm-grey">Warm Grey</SelectItem>
                            <SelectItem value="dark-grey">Dark Grey</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Size</Label>
                        <Select 
                          value={selectedLayout.plainBoardVariant?.size || 'normal'}
                          onValueChange={(size) => changePlainBoardVariant(selectedLayout.plainBoardVariant?.color || 'black', size)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="narrow">Narrow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-6 space-y-4">
                  {selectedLayout.textFields.map(field => (
                    <div 
                      key={field.id} 
                      className={`space-y-2 p-3 rounded-lg transition-colors ${
                        field.visible === false ? 'opacity-50' : ''
                      } ${
                        isAdminMode && selectedFieldId === field.id 
                          ? 'bg-primary/10 border border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => isAdminMode && setSelectedFieldId(field.id)}
                    >
                      <div className="flex items-center justify-between">
                        <Label htmlFor={field.id}>{field.label}</Label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFieldVisibility(field.id);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title={field.visible !== false ? 'Hide text' : 'Show text'}
                          >
                            {field.visible !== false ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Textarea
                        id={field.id}
                        value={textValues[field.id] || ''}
                        onChange={(e) => handleTextChange(field.id, e.target.value)}
                        placeholder={field.defaultValue}
                        rows={2}
                        className="resize-none"
                        disabled={field.visible === false}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Font: {field.fontSize}px, {field.fontWeight}</span>
                        <div className="flex items-center gap-2">
                          {/* Text Alignment Buttons */}
                          <div className="flex items-center border rounded-md">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateFieldProperty(field.id, 'textAlign', 'left');
                              }}
                              className={`p-1 transition-colors ${
                                (field.textAlign || 'left') === 'left' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                              title="Align Left"
                            >
                              <AlignLeft className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateFieldProperty(field.id, 'textAlign', 'center');
                              }}
                              className={`p-1 transition-colors ${
                                field.textAlign === 'center' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                              title="Align Center"
                            >
                              <AlignCenter className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateFieldProperty(field.id, 'textAlign', 'right');
                              }}
                              className={`p-1 transition-colors ${
                                field.textAlign === 'right' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                              title="Align Right"
                            >
                              <AlignRight className="h-3 w-3" />
                            </button>
                          </div>
                          <Select 
                            value={field.fontWeight}
                            onValueChange={(weight) => changeFontWeight(field.id, weight)}
                          >
                            <SelectTrigger className="h-6 w-24 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="300">Light</SelectItem>
                              <SelectItem value="400">Regular</SelectItem>
                              <SelectItem value="500">Medium</SelectItem>
                              <SelectItem value="600">SemiBold</SelectItem>
                              <SelectItem value="700">Bold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {isAdminMode && <p className="text-xs text-muted-foreground">Position: ({field.x}, {field.y})</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Reference Image */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Reference</CardTitle>
                  <CardDescription className="text-xs">Final result example</CardDescription>
                </CardHeader>
                <CardContent>
                  <img 
                    src={selectedLayout.previewImage} 
                    alt="Reference"
                    className="w-full rounded-lg"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Access
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Enter the admin password to adjust text positions and styles.
            </p>
            <Input
              type="password"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit}>
              Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MiloECRM;
