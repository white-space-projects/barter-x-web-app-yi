"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Plus, Pencil, Trash2, Package, FileText, 
  ArrowLeft, GripVertical, Search, Filter, SortDesc,
  Layers, X, ChevronDown, ImageIcon
} from "lucide-react";
import { toast } from "sonner";

// =============================================================================
// TYPES
// =============================================================================

type FieldScope = "product" | "offer";
type FieldType = "text" | "number" | "select" | "multiselect" | "boolean" | "date" | "textarea";
type DateMode = "month_year" | "day_month_year" | "year_only";

interface FieldOption {
  optionId: string;
  optionValue: string;
  optionLabel: string;
  sortOrder: number;
  isActive: boolean;
}

interface FieldDefinition {
  fieldId: string;
  subcategoryId: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: FieldType;
  fieldScope: FieldScope;
  placeholder?: string;
  helpText?: string;
  dateMode?: DateMode;
  isRequired: boolean;
  isFilterable: boolean;
  isActive: boolean;
  sortOrder: number;
  options?: FieldOption[];
}

interface Subcategory {
  subcategoryId: string;
  categoryId: string;
  name: string;
  slug: string;
  categoryName?: string;
  barterTypeName?: string;
  barterTypeId?: string;
  productFields: FieldDefinition[];
  offerFields: FieldDefinition[];
}

interface BarterType {
  barterTypeId: string;
  name: string;
  slug: string;
}

interface Category {
  categoryId: string;
  name: string;
  barterTypeId: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Single Select" },
  { value: "multiselect", label: "Multi Select" },
  { value: "boolean", label: "Yes/No Toggle" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Long Text" },
];

const DATE_MODES: { value: DateMode; label: string }[] = [
  { value: "month_year", label: "Month / Year" },
  { value: "day_month_year", label: "Day / Month / Year" },
  { value: "year_only", label: "Year only" },
];

// Only show these barter types (Goods, Rentals, Mini Jobs)
const ALLOWED_BARTER_TYPE_IDS = [
  "27a2dfe7-2527-4195-8a0c-7663cb405f8a", // Goods
  "46e8b0d9-b53b-40c6-bace-774647f0ce57", // Rentals
  "34c6aceb-5b83-4ed3-a1f8-2be770a17f52", // Mini Jobs
];
const DEFAULT_BARTER_TYPE_ID = "27a2dfe7-2527-4195-8a0c-7663cb405f8a"; // Goods

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function FieldSchemaPage() {
  // ---------------------------------------------------------------------------
  // STATE - List View
  // ---------------------------------------------------------------------------
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [barterTypes, setBarterTypes] = useState<BarterType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBarterType, setSelectedBarterType] = useState<string>(DEFAULT_BARTER_TYPE_ID); // Default to Goods
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showNoFields, setShowNoFields] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  
  // ---------------------------------------------------------------------------
  // STATE - Detail View
  // ---------------------------------------------------------------------------
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [activeScope, setActiveScope] = useState<FieldScope>("product");
  const [fieldLoading, setFieldLoading] = useState(false);
  
  // ---------------------------------------------------------------------------
  // STATE - Add/Edit Field Dialog
  // ---------------------------------------------------------------------------
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [fieldSearchQuery, setFieldSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [savingField, setSavingField] = useState(false);
  
  // Form state
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [placeholder, setPlaceholder] = useState("");
  const [dateMode, setDateMode] = useState<DateMode>("day_month_year");
  const [isRequired, setIsRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  
  // Option search state (for select/multiselect field types)
  const [optionSearchQuery, setOptionSearchQuery] = useState("");
  const [searchingOptions, setSearchingOptions] = useState(false);
  const [existingOptions, setExistingOptions] = useState<Array<{
    optionId: string;
    optionLabel: string;
    optionValue: string;
    fieldLabel: string;
    subcategoryName: string;
  }>>([]);
  
  // Delete confirmation
  const [deleteField, setDeleteField] = useState<FieldDefinition | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Drag reorder
  const [draggedField, setDraggedField] = useState<FieldDefinition | null>(null);

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------
  
  const loadSubcategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/data/subcategories?includeFields=true");
      if (!response.ok) throw new Error("Failed to fetch subcategories");
      const data = await response.json();
      setSubcategories(data.subcategories || []);
    } catch (error) {
      console.error("Failed to load subcategories:", error);
      toast.error("Failed to load subcategories");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBarterTypes = useCallback(async () => {
    try {
      const response = await fetch("/api/data/barter-types");
      if (!response.ok) throw new Error("Failed to fetch barter types");
      const data = await response.json();
      // Filter to only allowed barter types (Goods, Rentals, Mini Jobs)
      const allowedTypes = (data.barterTypes || []).filter(
        (bt: BarterType) => ALLOWED_BARTER_TYPE_IDS.includes(bt.barterTypeId)
      );
      setBarterTypes(allowedTypes);
    } catch (error) {
      console.error("Failed to load barter types:", error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/data/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }, []);

  useEffect(() => {
    loadSubcategories();
    loadBarterTypes();
    loadCategories();
  }, [loadSubcategories, loadBarterTypes, loadCategories]);

  // ---------------------------------------------------------------------------
  // FILTERED DATA
  // ---------------------------------------------------------------------------
  
  const filteredSubcategories = subcategories.filter((sub) => {
    // Search filter
    if (searchQuery && !sub.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Barter type filter (always filter since we removed "all" option)
    if (sub.barterTypeId !== selectedBarterType) {
      return false;
    }
    
    // Categories filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(sub.categoryId)) {
      return false;
    }
    
    // No fields filter
    if (showNoFields) {
      const totalFields = (sub.productFields?.length || 0) + (sub.offerFields?.length || 0);
      if (totalFields > 0) return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by newest (reverse alphabetical as proxy - would need createdAt field for proper sorting)
    return b.name.localeCompare(a.name);
  });

  const filteredCategories = categories.filter((cat) => {
    // Filter by search
    if (categorySearch && !cat.name.toLowerCase().includes(categorySearch.toLowerCase())) {
      return false;
    }
    // Filter by selected barter type (always filter since we removed "all" option)
    if (cat.barterTypeId !== selectedBarterType) {
      return false;
    }
    return true;
  });

  // Get current fields based on active scope
  const currentFields = selectedSubcategory 
    ? (activeScope === "product" ? selectedSubcategory.productFields || [] : selectedSubcategory.offerFields || [])
    : [];

  // Search existing fields for duplicate check
  const existingFieldMatches = currentFields.filter((f) =>
    fieldSearchQuery && f.fieldLabel.toLowerCase().includes(fieldSearchQuery.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // FIELD CRUD HANDLERS
  // ---------------------------------------------------------------------------
  
  const openAddFieldDialog = () => {
    setEditingField(null);
    setFieldSearchQuery("");
    setShowCreateForm(false);
    setFieldLabel("");
    setFieldType("text");
    setPlaceholder("");
    setDateMode("day_month_year");
    setIsRequired(false);
    setFieldOptions([]);
    setOptionSearchQuery("");
    setExistingOptions([]);
    setShowFieldDialog(true);
  };

  const openEditFieldDialog = (field: FieldDefinition) => {
    setEditingField(field);
    setFieldSearchQuery("");
    setShowCreateForm(true);
    setFieldLabel(field.fieldLabel);
    setFieldType(field.fieldType);
    setPlaceholder(field.placeholder || "");
    setDateMode(field.dateMode || "day_month_year");
    setIsRequired(field.isRequired);
    setFieldOptions(field.options?.map(o => o.optionLabel) || []);
    setOptionSearchQuery("");
    setExistingOptions([]);
    setShowFieldDialog(true);
  };
  
  // Search existing options (debounced)
  const searchOptions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setExistingOptions([]);
      return;
    }
    
    setSearchingOptions(true);
    try {
      const response = await fetch(`/api/data/field-options/search?q=${encodeURIComponent(query)}&limit=15`);
      if (!response.ok) throw new Error("Failed to search options");
      const data = await response.json();
      setExistingOptions(data.options || []);
    } catch (error) {
      console.error("Failed to search options:", error);
      setExistingOptions([]);
    } finally {
      setSearchingOptions(false);
    }
  }, []);
  
  // Debounce option search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (optionSearchQuery.trim()) {
        searchOptions(optionSearchQuery);
      } else {
        setExistingOptions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [optionSearchQuery, searchOptions]);

  const handleSaveField = async () => {
    if (!selectedSubcategory || !fieldLabel.trim()) {
      toast.error("Field label is required");
      return;
    }
    
    // Validate options for select types
    if ((fieldType === "select" || fieldType === "multiselect") && fieldOptions.length === 0) {
      toast.error("At least one option is required for select fields");
      return;
    }

    setSavingField(true);
    try {
      const payload: Record<string, unknown> = {
        fieldLabel: fieldLabel.trim(),
        fieldType,
        fieldScope: activeScope,
        placeholder: placeholder.trim() || undefined,
        isRequired,
      };

      // Add date mode for date fields
      if (fieldType === "date") {
        payload.dateMode = dateMode;
      }

      // Add options for select types
      if ((fieldType === "select" || fieldType === "multiselect") && fieldOptions.some(o => o.trim())) {
        payload.options = fieldOptions.filter(o => o.trim()).map((label, index) => ({
          optionLabel: label.trim(),
          optionValue: label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"),
          sortOrder: index,
        }));
      }

      if (editingField) {
        // Update existing field
        const response = await fetch(
          `/api/data/subcategories/${selectedSubcategory.subcategoryId}/fields/${editingField.fieldId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update field");
        }
        toast.success("Field updated");
      } else {
        // Create new field
        const response = await fetch(
          `/api/data/subcategories/${selectedSubcategory.subcategoryId}/fields`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create field");
        }
        toast.success("Field created");
      }

      setShowFieldDialog(false);
      // Refresh subcategory data
      await refreshSelectedSubcategory();
    } catch (error) {
      console.error("Failed to save field:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save field");
    } finally {
      setSavingField(false);
    }
  };

  const handleDeleteField = async () => {
    if (!selectedSubcategory || !deleteField) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/data/subcategories/${selectedSubcategory.subcategoryId}/fields/${deleteField.fieldId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete field");
      
      toast.success("Field deleted");
      setDeleteField(null);
      await refreshSelectedSubcategory();
    } catch (error) {
      console.error("Failed to delete field:", error);
      toast.error("Failed to delete field");
    } finally {
      setDeleting(false);
    }
  };

  const refreshSelectedSubcategory = async () => {
    if (!selectedSubcategory) return;
    
    setFieldLoading(true);
    try {
      const response = await fetch(`/api/data/subcategories/${selectedSubcategory.subcategoryId}?includeFields=true`);
      if (!response.ok) throw new Error("Failed to fetch subcategory");
      const data = await response.json();
      setSelectedSubcategory(data.subcategory);
      
      // Also update in the list
      setSubcategories(prev => prev.map(s => 
        s.subcategoryId === data.subcategory.subcategoryId ? data.subcategory : s
      ));
    } catch (error) {
      console.error("Failed to refresh subcategory:", error);
    } finally {
      setFieldLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DRAG & DROP REORDER
  // ---------------------------------------------------------------------------
  
  const handleDragStart = (field: FieldDefinition) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent, targetField: FieldDefinition) => {
    e.preventDefault();
    if (!draggedField || draggedField.fieldId === targetField.fieldId) return;
  };

  const handleDrop = async (e: React.DragEvent, targetField: FieldDefinition) => {
    e.preventDefault();
    if (!draggedField || !selectedSubcategory || draggedField.fieldId === targetField.fieldId) {
      setDraggedField(null);
      return;
    }

    // Reorder locally first for immediate feedback
    const fields = [...currentFields];
    const draggedIndex = fields.findIndex(f => f.fieldId === draggedField.fieldId);
    const targetIndex = fields.findIndex(f => f.fieldId === targetField.fieldId);
    
    fields.splice(draggedIndex, 1);
    fields.splice(targetIndex, 0, draggedField);
    
    // Update sort orders
    const updatedFields = fields.map((f, i) => ({ ...f, sortOrder: i }));
    
    // Update local state
    if (activeScope === "product") {
      setSelectedSubcategory(prev => prev ? { ...prev, productFields: updatedFields } : null);
    } else {
      setSelectedSubcategory(prev => prev ? { ...prev, offerFields: updatedFields } : null);
    }

    // Persist to server
    try {
      for (const field of updatedFields) {
        await fetch(
          `/api/data/subcategories/${selectedSubcategory.subcategoryId}/fields/${field.fieldId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: field.sortOrder }),
          }
        );
      }
    } catch (error) {
      console.error("Failed to save field order:", error);
      toast.error("Failed to save field order");
      await refreshSelectedSubcategory();
    }

    setDraggedField(null);
  };

  // ---------------------------------------------------------------------------
  // RENDER - LIST VIEW (Screen 1)
  // ---------------------------------------------------------------------------
  
  if (!selectedSubcategory) {
    return (
      <div className="h-full flex flex-col">
        {/* Header with Search and Filters */}
        <div className="flex flex-col gap-4 pb-6 border-b border-border mb-6">
          <h1 className="text-2xl font-bold">Field Schema</h1>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subcategories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Barter Type Filter - No "All" option, defaults to Goods */}
            <Select 
              value={selectedBarterType} 
              onValueChange={(value) => {
                setSelectedBarterType(value);
                // Clear category selection when barter type changes
                setSelectedCategories([]);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {barterTypes.map((bt) => (
                  <SelectItem key={bt.barterTypeId} value={bt.barterTypeId}>
                    {bt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Categories Multi-Select - stays open until manually closed */}
            <DropdownMenu open={categoryDropdownOpen} onOpenChange={setCategoryDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Categories
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5">
                      {selectedCategories.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
                <div className="flex items-center justify-between p-2">
                  <DropdownMenuLabel className="p-0 text-xs font-normal text-muted-foreground">
                    Select categories
                  </DropdownMenuLabel>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setCategoryDropdownOpen(false)}
                  >
                    Done
                  </Button>
                </div>
                <div className="px-2 pb-2">
                  <Input
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[200px]">
                  {filteredCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No categories found
                    </p>
                  ) : (
                    <div className="px-2 space-y-1">
                      {filteredCategories.map((cat) => (
                        <label
                          key={cat.categoryId}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedCategories.includes(cat.categoryId)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCategories([...selectedCategories, cat.categoryId]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(id => id !== cat.categoryId));
                              }
                            }}
                          />
                          <span className="text-sm">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {selectedCategories.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => setSelectedCategories([])}
                      >
                        Clear all ({selectedCategories.length})
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* No Fields Filter */}
            <Button
              variant={showNoFields ? "default" : "outline"}
              onClick={() => setShowNoFields(!showNoFields)}
              className="gap-2"
            >
              No Fields
            </Button>

            {/* Sort - Newest first (always selected) */}
            <Button
              variant="default"
              className="gap-2"
            >
              <SortDesc className="h-4 w-4" />
              Newest
            </Button>
          </div>
        </div>

        {/* Subcategory Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSubcategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No subcategories found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSubcategories.map((sub) => (
              <div
                key={sub.subcategoryId}
                onClick={() => setSelectedSubcategory(sub)}
                className="min-w-[368px] p-4 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon placeholder */}
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Layers className="h-6 w-6 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{sub.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {sub.categoryName || "Unknown Category"}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs font-medium">
                          {sub.productFields?.length || 0} product
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-xs font-medium">
                          {sub.offerFields?.length || 0} offer
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER - DETAIL VIEW (Screen 2)
  // ---------------------------------------------------------------------------
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 pb-6 border-b border-border mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedSubcategory(null)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
          <Layers className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1">
          <h1 className="text-xl font-bold">{selectedSubcategory.name}</h1>
          <p className="text-sm text-muted-foreground">
            {selectedSubcategory.categoryName}
          </p>
        </div>
      </div>

      {/* Tabs for Product Fields / Offer Fields */}
      <Tabs value={activeScope} onValueChange={(v) => setActiveScope(v as FieldScope)} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="product" className="gap-2">
              <Package className="h-4 w-4" />
              Product Fields ({selectedSubcategory.productFields?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="offer" className="gap-2">
              <FileText className="h-4 w-4" />
              Offer Fields ({selectedSubcategory.offerFields?.length || 0})
            </TabsTrigger>
          </TabsList>

          <Button onClick={openAddFieldDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Field
          </Button>
        </div>

        <TabsContent value="product" className="flex-1 mt-0">
          <FieldList
            fields={selectedSubcategory.productFields || []}
            loading={fieldLoading}
            onEdit={openEditFieldDialog}
            onDelete={setDeleteField}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggedField={draggedField}
            emptyMessage="No product fields defined"
            emptyDescription="Product fields define the specifications shown for products in this subcategory"
          />
        </TabsContent>

        <TabsContent value="offer" className="flex-1 mt-0">
          <FieldList
            fields={selectedSubcategory.offerFields || []}
            loading={fieldLoading}
            onEdit={openEditFieldDialog}
            onDelete={setDeleteField}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggedField={draggedField}
            emptyMessage="No offer fields defined"
            emptyDescription="Offer fields are shown to users when creating offers in this subcategory"
          />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Field Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingField ? "Edit Field" : `Add ${activeScope === "product" ? "Product" : "Offer"} Field`}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-4">
              {/* Search existing fields (only for new fields) */}
              {!editingField && !showCreateForm && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Search or create a field</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Type field name..."
                        value={fieldSearchQuery}
                        onChange={(e) => setFieldSearchQuery(e.target.value)}
                        className="pl-9"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Show existing fields that match search */}
                  {fieldSearchQuery && existingFieldMatches.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Existing fields matching &quot;{fieldSearchQuery}&quot;:</p>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {existingFieldMatches.map((field) => (
                          <div
                            key={field.fieldId}
                            className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-medium text-sm">{field.fieldLabel}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Key: {field.fieldKey}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {FIELD_TYPES.find(t => t.value === field.fieldType)?.label || field.fieldType}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show "Create new" button only when:
                      1. User has typed something
                      2. No exact match exists (case-insensitive) */}
                  {fieldSearchQuery.trim() && !currentFields.some(
                    f => f.fieldLabel.toLowerCase() === fieldSearchQuery.trim().toLowerCase()
                  ) && (
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-primary text-primary hover:bg-primary/5"
                      onClick={() => {
                        setShowCreateForm(true);
                        setFieldLabel(fieldSearchQuery.trim());
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create &quot;{fieldSearchQuery.trim()}&quot;
                    </Button>
                  )}

                  {/* Empty state when no search query */}
                  {!fieldSearchQuery && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Start typing to search existing fields or create a new one
                    </p>
                  )}

                  {/* No results message when search has no matches */}
                  {fieldSearchQuery && existingFieldMatches.length === 0 && currentFields.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      No existing fields match &quot;{fieldSearchQuery}&quot;
                    </p>
                  )}
                </div>
              )}

              {/* Create/Edit Form */}
              {(editingField || showCreateForm) && (
                <div className="space-y-4">
                  {/* Field Label */}
                  <div className="space-y-2">
                    <Label htmlFor="fieldLabel">Field Label *</Label>
                    <Input
                      id="fieldLabel"
                      placeholder="e.g., Screen Size, Battery Health"
                      value={fieldLabel}
                      onChange={(e) => setFieldLabel(e.target.value)}
                    />
                  </div>

                  {/* Field Type */}
                  <div className="space-y-2">
                    <Label>Field Type *</Label>
                    <Select value={fieldType} onValueChange={(v) => setFieldType(v as FieldType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Options for Select Types - Search first, create if not found */}
                  {(fieldType === "select" || fieldType === "multiselect") && (
                    <div className="space-y-3">
                      <Label>Options</Label>
                      
                      {/* Selected options list */}
                      {fieldOptions.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground">Selected options ({fieldOptions.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {fieldOptions.map((option, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-sm"
                              >
                                <span>{option}</span>
                                <button
                                  type="button"
                                  onClick={() => setFieldOptions(fieldOptions.filter((_, i) => i !== index))}
                                  className="hover:bg-primary/20 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Search/Add option input */}
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search or type new option..."
                            value={optionSearchQuery}
                            onChange={(e) => setOptionSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                          {searchingOptions && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        
                        {/* Existing options matching search */}
                        {optionSearchQuery && existingOptions.length > 0 && (
                          <div className="border rounded-lg overflow-hidden">
                            <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/50">
                              Existing options matching &quot;{optionSearchQuery}&quot;:
                            </p>
                            <div className="max-h-[150px] overflow-y-auto">
                              {existingOptions
                                .filter(opt => !fieldOptions.some(
                                  fo => fo.toLowerCase() === opt.optionLabel.toLowerCase()
                                ))
                                .map((opt) => (
                                  <button
                                    key={opt.optionId}
                                    type="button"
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 text-left text-sm border-t first:border-t-0"
                                    onClick={() => {
                                      // Add existing option (case-insensitive duplicate check)
                                      if (!fieldOptions.some(fo => fo.toLowerCase() === opt.optionLabel.toLowerCase())) {
                                        setFieldOptions([...fieldOptions, opt.optionLabel]);
                                        setOptionSearchQuery("");
                                        setExistingOptions([]);
                                      }
                                    }}
                                  >
                                    <span className="font-medium">{opt.optionLabel}</span>
                                    <span className="text-xs text-muted-foreground">
                                      Used in: {opt.subcategoryName}
                                    </span>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Create new option button - only show if:
                            1. User has typed something
                            2. No exact match exists in selected options (case-insensitive)
                            3. Trimmed and not empty */}
                        {optionSearchQuery.trim() && !fieldOptions.some(
                          fo => fo.toLowerCase() === optionSearchQuery.trim().toLowerCase()
                        ) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full border-dashed border-primary text-primary hover:bg-primary/5"
                            onClick={() => {
                              const trimmed = optionSearchQuery.trim();
                              if (trimmed && !fieldOptions.some(fo => fo.toLowerCase() === trimmed.toLowerCase())) {
                                setFieldOptions([...fieldOptions, trimmed]);
                                setOptionSearchQuery("");
                                setExistingOptions([]);
                              }
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create &quot;{optionSearchQuery.trim()}&quot;
                          </Button>
                        )}
                        
                        {/* Already added message */}
                        {optionSearchQuery.trim() && fieldOptions.some(
                          fo => fo.toLowerCase() === optionSearchQuery.trim().toLowerCase()
                        ) && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            &quot;{optionSearchQuery.trim()}&quot; is already added
                          </p>
                        )}
                        
                        {/* Empty state */}
                        {!optionSearchQuery && fieldOptions.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            Type to search existing options or create new ones
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Date Mode for Date Type */}
                  {fieldType === "date" && (
                    <div className="space-y-2">
                      <Label>Date Format</Label>
                      <Select value={dateMode} onValueChange={(v) => setDateMode(v as DateMode)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DATE_MODES.map((mode) => (
                            <SelectItem key={mode.value} value={mode.value}>
                              {mode.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Placeholder */}
                  <div className="space-y-2">
                    <Label htmlFor="placeholder">Placeholder Text</Label>
                    <Input
                      id="placeholder"
                      placeholder="e.g., Enter screen size in inches"
                      value={placeholder}
                      onChange={(e) => setPlaceholder(e.target.value)}
                    />
                  </div>

                  {/* Required Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Required Field</Label>
                      <p className="text-xs text-muted-foreground">
                        User must fill this field
                      </p>
                    </div>
                    <Switch
                      checked={isRequired}
                      onCheckedChange={setIsRequired}
                    />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {(editingField || showCreateForm) && (
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowFieldDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveField} disabled={savingField || !fieldLabel.trim()}>
                {savingField && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingField ? "Update" : "Create"} Field
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteField} onOpenChange={() => setDeleteField(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteField?.fieldLabel}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteField}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =============================================================================
// FIELD LIST COMPONENT
// =============================================================================

interface FieldListProps {
  fields: FieldDefinition[];
  loading: boolean;
  onEdit: (field: FieldDefinition) => void;
  onDelete: (field: FieldDefinition) => void;
  onDragStart: (field: FieldDefinition) => void;
  onDragOver: (e: React.DragEvent, field: FieldDefinition) => void;
  onDrop: (e: React.DragEvent, field: FieldDefinition) => void;
  draggedField: FieldDefinition | null;
  emptyMessage: string;
  emptyDescription: string;
}

function FieldList({
  fields,
  loading,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  draggedField,
  emptyMessage,
  emptyDescription,
}: FieldListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground/70 mt-1">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {fields.sort((a, b) => a.sortOrder - b.sortOrder).map((field) => (
        <div
          key={field.fieldId}
          draggable
          onDragStart={() => onDragStart(field)}
          onDragOver={(e) => onDragOver(e, field)}
          onDrop={(e) => onDrop(e, field)}
          className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${
            draggedField?.fieldId === field.fieldId ? "opacity-50" : ""
          }`}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{field.fieldLabel}</span>
              {field.isRequired && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Required
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px]">
                {FIELD_TYPES.find(t => t.value === field.fieldType)?.label || field.fieldType}
              </Badge>
              {(field.fieldType === "select" || field.fieldType === "multiselect") && field.options && (
                <span className="text-xs text-muted-foreground">
                  {field.options.length} options
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(field)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(field)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
