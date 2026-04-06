"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Plus, Pencil, Trash2, Package, FileText, 
  ChevronRight, GripVertical, X, Search
} from "lucide-react";
import { toast } from "sonner";

type FieldScope = "product" | "offer";

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
  fieldType: "text" | "number" | "select" | "boolean" | "date" | "textarea";
  fieldScope: FieldScope;
  placeholder?: string;
  helpText?: string;
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
  productFields: FieldDefinition[];
  offerFields: FieldDefinition[];
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "boolean", label: "Yes/No Toggle" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Long Text" },
];

export default function FieldSchemaPage() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [activeScope, setActiveScope] = useState<FieldScope>("product");
  
  // Sheet state for adding/editing fields
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<string>("text");
  const [placeholder, setPlaceholder] = useState("");
  const [helpText, setHelpText] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [isFilterable, setIsFilterable] = useState(false);
  const [selectOptions, setSelectOptions] = useState<string[]>([""]);
  
  // Delete confirmation
  const [deleteField, setDeleteField] = useState<FieldDefinition | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch subcategories with their fields
  useEffect(() => {
    async function loadSubcategories() {
      try {
        const response = await fetch("/api/data/subcategories?includeFields=true");
        if (response.ok) {
          const data = await response.json();
          setSubcategories(data.subcategories || []);
        }
      } catch (error) {
        console.error("Failed to load subcategories:", error);
        toast.error("Failed to load subcategories");
      } finally {
        setLoading(false);
      }
    }
    loadSubcategories();
  }, []);

  // Reset form when sheet closes
  useEffect(() => {
    if (!sheetOpen) {
      setEditingField(null);
      setFieldLabel("");
      setFieldType("text");
      setPlaceholder("");
      setHelpText("");
      setIsRequired(false);
      setIsFilterable(false);
      setSelectOptions([""]);
    }
  }, [sheetOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editingField) {
      setFieldLabel(editingField.fieldLabel);
      setFieldType(editingField.fieldType);
      setPlaceholder(editingField.placeholder || "");
      setHelpText(editingField.helpText || "");
      setIsRequired(editingField.isRequired);
      setIsFilterable(editingField.isFilterable);
      if (editingField.options && editingField.options.length > 0) {
        setSelectOptions(editingField.options.map(o => o.optionLabel));
      }
    }
  }, [editingField]);

  const handleAddField = () => {
    setEditingField(null);
    setSheetOpen(true);
  };

  const handleEditField = (field: FieldDefinition) => {
    setEditingField(field);
    setSheetOpen(true);
  };

  const refreshSubcategoryData = async () => {
    if (!selectedSubcategory) return;
    
    const refreshResponse = await fetch(
      `/api/data/subcategories/${selectedSubcategory.subcategoryId}/fields`
    );
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      const updated = {
        ...selectedSubcategory,
        productFields: data.productFields || [],
        offerFields: data.offerFields || [],
      };
      setSelectedSubcategory(updated);
      setSubcategories(prev => 
        prev.map(sc => 
          sc.subcategoryId === selectedSubcategory.subcategoryId ? updated : sc
        )
      );
    }
  };

  const handleSaveField = async () => {
    if (!selectedSubcategory || !fieldLabel.trim()) {
      toast.error("Please enter a field label");
      return;
    }

    setSaving(true);
    try {
      if (editingField) {
        // Update existing field
        const response = await fetch(
          `/api/data/subcategories/${selectedSubcategory.subcategoryId}/fields/${editingField.fieldId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fieldLabel: fieldLabel.trim(),
              fieldType,
              placeholder: placeholder.trim() || null,
              helpText: helpText.trim() || null,
              isRequired,
              isFilterable,
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to update field");
        toast.success("Field updated");
      } else {
        // Create new field
        const response = await fetch(
          `/api/data/subcategories/${selectedSubcategory.subcategoryId}/fields`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fieldLabel: fieldLabel.trim(),
              fieldType,
              fieldScope: activeScope,
              placeholder: placeholder.trim() || null,
              helpText: helpText.trim() || null,
              isRequired,
              isFilterable,
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to create field");
        
        // If it's a select field, add the options
        if (fieldType === "select" && selectOptions.some(o => o.trim())) {
          const fieldData = await response.json();
          const fieldId = fieldData.field?.fieldId;
          
          if (fieldId) {
            for (const option of selectOptions.filter(o => o.trim())) {
              await fetch(
                `/api/data/subcategories/${selectedSubcategory.subcategoryId}/fields/${fieldId}/options`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    optionLabel: option.trim(),
                    optionValue: option.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"),
                  }),
                }
              );
            }
          }
        }
        
        toast.success("Field created");
      }

      await refreshSubcategoryData();
      setSheetOpen(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save field");
    } finally {
      setSaving(false);
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
      await refreshSubcategoryData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete field");
    } finally {
      setDeleting(false);
      setDeleteField(null);
    }
  };

  const addOption = () => setSelectOptions([...selectOptions, ""]);
  const removeOption = (index: number) => {
    if (selectOptions.length > 1) {
      setSelectOptions(selectOptions.filter((_, i) => i !== index));
    }
  };
  const updateOption = (index: number, value: string) => {
    const updated = [...selectOptions];
    updated[index] = value;
    setSelectOptions(updated);
  };

  // Filter subcategories by search
  const filteredSubcategories = subcategories.filter(sc =>
    search === "" ||
    sc.name.toLowerCase().includes(search.toLowerCase()) ||
    sc.categoryName?.toLowerCase().includes(search.toLowerCase()) ||
    sc.barterTypeName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Field Schema</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define custom fields for product specifications and offer details per subcategory
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subcategory List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Subcategories</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-1 p-2">
                {filteredSubcategories.map((sc) => (
                  <button
                    key={sc.subcategoryId}
                    onClick={() => setSelectedSubcategory(sc)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSubcategory?.subcategoryId === sc.subcategoryId
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{sc.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {sc.barterTypeName} &gt; {sc.categoryName}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        {sc.productFields?.length || 0} product
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {sc.offerFields?.length || 0} offer
                      </Badge>
                    </div>
                  </button>
                ))}
                {filteredSubcategories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No subcategories found
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Field Editor */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedSubcategory ? selectedSubcategory.name : "Select a Subcategory"}
              </CardTitle>
              {selectedSubcategory && (
                <Button size="sm" onClick={handleAddField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedSubcategory ? (
              <Tabs value={activeScope} onValueChange={(v) => setActiveScope(v as FieldScope)}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="product" className="gap-2">
                    <Package className="h-4 w-4" />
                    Product Fields ({selectedSubcategory.productFields?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="offer" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Offer Fields ({selectedSubcategory.offerFields?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="product" className="mt-0">
                  <ScrollArea className="h-[calc(100vh-420px)]">
                    {(selectedSubcategory.productFields?.length || 0) > 0 ? (
                      <div className="space-y-2">
                        {selectedSubcategory.productFields?.map((field) => (
                          <div
                            key={field.fieldId}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
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
                                <span className="text-xs text-muted-foreground">
                                  {field.fieldKey}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditField(field)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteField(field)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No product fields defined yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click &quot;Add Field&quot; to create your first product field
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="offer" className="mt-0">
                  <ScrollArea className="h-[calc(100vh-420px)]">
                    {(selectedSubcategory.offerFields?.length || 0) > 0 ? (
                      <div className="space-y-2">
                        {selectedSubcategory.offerFields?.map((field) => (
                          <div
                            key={field.fieldId}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
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
                                <span className="text-xs text-muted-foreground">
                                  {field.fieldKey}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditField(field)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteField(field)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No offer fields defined yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click &quot;Add Field&quot; to create your first offer field
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a subcategory from the list to manage its fields
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Field Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md flex flex-col h-full">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>
              {editingField ? "Edit Field" : `Add ${activeScope === "product" ? "Product" : "Offer"} Field`}
            </SheetTitle>
            <SheetDescription>
              {editingField 
                ? "Update the field configuration below" 
                : `Create a new field for ${activeScope === "product" ? "product specifications" : "offer details"}`}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-5 py-4">
              {/* Field Label */}
              <div className="space-y-2">
                <Label htmlFor="fieldLabel">Field Label *</Label>
                <Input
                  id="fieldLabel"
                  placeholder="e.g., RAM Size, Battery Health"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The display name shown to users. Field key will be auto-generated.
                </p>
              </div>

              {/* Field Type */}
              <div className="space-y-2">
                <Label>Field Type *</Label>
                <Select value={fieldType} onValueChange={setFieldType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
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

              {/* Select Options (only for select type) */}
              {fieldType === "select" && (
                <div className="space-y-2">
                  <Label>Dropdown Options</Label>
                  <div className="space-y-2">
                    {selectOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          disabled={selectOptions.length <= 1}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
              )}

              {/* Placeholder */}
              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder Text</Label>
                <Input
                  id="placeholder"
                  placeholder="e.g., Enter RAM size..."
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                />
              </div>

              {/* Help Text */}
              <div className="space-y-2">
                <Label htmlFor="helpText">Help Text</Label>
                <Textarea
                  id="helpText"
                  placeholder="Additional instructions for users"
                  value={helpText}
                  onChange={(e) => setHelpText(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isRequired">Required Field</Label>
                    <p className="text-xs text-muted-foreground">
                      Users must fill this field
                    </p>
                  </div>
                  <Switch
                    id="isRequired"
                    checked={isRequired}
                    onCheckedChange={setIsRequired}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isFilterable">Filterable</Label>
                    <p className="text-xs text-muted-foreground">
                      Show in search filters
                    </p>
                  </div>
                  <Switch
                    id="isFilterable"
                    checked={isFilterable}
                    onCheckedChange={setIsFilterable}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Save Button - Fixed at bottom */}
          <div className="flex-shrink-0 pt-4 border-t mt-auto">
            <Button
              onClick={handleSaveField}
              disabled={saving || !fieldLabel.trim()}
              className="w-full"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingField ? "Update Field" : "Create Field"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteField} onOpenChange={() => setDeleteField(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteField?.fieldLabel}&quot;? 
              This action cannot be undone and may affect existing data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteField}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
