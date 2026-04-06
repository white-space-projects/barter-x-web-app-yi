"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, ChevronRight, Package, Layers, 
  Plus, X, Save, Loader2, GripVertical, Trash2
} from "lucide-react";
import { toast } from "sonner";

// Types matching the repository
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
  productFields: FieldDefinition[];
  categoryName?: string;
  barterTypeName?: string;
  barterTypeSlug?: string;
}

const fieldTypes = [
  { value: "text", label: "Text Input" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown Select" },
  { value: "boolean", label: "Yes/No Toggle" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Long Text" },
];

export default function FieldSchemaPage() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [barterTypeFilter, setBarterTypeFilter] = useState<string>("all");
  
  // Detail panel state
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Field editing state
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [newOptionValue, setNewOptionValue] = useState("");
  const [newOptionLabel, setNewOptionLabel] = useState("");

  // Unique barter types for filter
  const barterTypes = Array.from(new Set(subcategories.map(s => s.barterTypeSlug).filter(Boolean)));

  useEffect(() => {
    loadSubcategories();
  }, []);

  async function loadSubcategories() {
    setLoading(true);
    try {
      const response = await fetch("/api/data/subcategories?includeFields=true");
      if (!response.ok) throw new Error("Failed to load subcategories");
      const data = await response.json();
      setSubcategories(data.subcategories || []);
    } catch (error) {
      console.error("Failed to load subcategories:", error);
      toast.error("Failed to load subcategories");
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(subcategory: Subcategory) {
    // Fetch full subcategory with fields
    try {
      const response = await fetch(`/api/data/subcategories/${subcategory.subcategoryId}`);
      if (!response.ok) throw new Error("Failed to load subcategory");
      const data = await response.json();
      setSelectedSubcategory(data.subcategory);
      setFields([...data.subcategory.productFields]);
      setEditingField(null);
      setDetailOpen(true);
    } catch (error) {
      console.error("Failed to load subcategory:", error);
      toast.error("Failed to load subcategory details");
    }
  }

  async function handleAddField() {
    if (!selectedSubcategory) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/data/subcategories/${selectedSubcategory.subcategoryId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldKey: `field_${Date.now()}`,
          fieldLabel: "New Field",
          fieldType: "text",
          isRequired: false,
          isFilterable: false,
        }),
      });

      if (!response.ok) throw new Error("Failed to create field");
      const data = await response.json();
      
      setFields(prev => [...prev, data.field]);
      setEditingField(data.field);
      toast.success("Field created");
    } catch (error) {
      console.error("Failed to create field:", error);
      toast.error("Failed to create field");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateField(field: FieldDefinition) {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/data/subcategories/${selectedSubcategory?.subcategoryId}/fields/${field.fieldId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fieldKey: field.fieldKey,
            fieldLabel: field.fieldLabel,
            fieldType: field.fieldType,
            placeholder: field.placeholder || null,
            helpText: field.helpText || null,
            isRequired: field.isRequired,
            isFilterable: field.isFilterable,
            isActive: field.isActive,
            sortOrder: field.sortOrder,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update field");
      const data = await response.json();
      
      setFields(prev => prev.map(f => f.fieldId === field.fieldId ? data.field : f));
      setEditingField(data.field);
      toast.success("Field updated");
    } catch (error) {
      console.error("Failed to update field:", error);
      toast.error("Failed to update field");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteField(fieldId: string) {
    if (!confirm("Are you sure you want to delete this field?")) return;
    
    setSaving(true);
    try {
      const response = await fetch(
        `/api/data/subcategories/${selectedSubcategory?.subcategoryId}/fields/${fieldId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete field");
      
      setFields(prev => prev.filter(f => f.fieldId !== fieldId));
      if (editingField?.fieldId === fieldId) {
        setEditingField(null);
      }
      toast.success("Field deleted");
    } catch (error) {
      console.error("Failed to delete field:", error);
      toast.error("Failed to delete field");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddOption() {
    if (!editingField || !newOptionValue.trim() || !newOptionLabel.trim()) return;
    
    setSaving(true);
    try {
      const response = await fetch(
        `/api/data/subcategories/${selectedSubcategory?.subcategoryId}/fields/${editingField.fieldId}/options`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            optionValue: newOptionValue.trim(),
            optionLabel: newOptionLabel.trim(),
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create option");
      const data = await response.json();
      
      const updatedField = {
        ...editingField,
        options: [...(editingField.options || []), data.option],
      };
      setEditingField(updatedField);
      setFields(prev => prev.map(f => f.fieldId === editingField.fieldId ? updatedField : f));
      setNewOptionValue("");
      setNewOptionLabel("");
      toast.success("Option added");
    } catch (error) {
      console.error("Failed to add option:", error);
      toast.error("Failed to add option");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOption(optionId: string) {
    if (!editingField) return;
    
    setSaving(true);
    try {
      const response = await fetch(
        `/api/data/subcategories/${selectedSubcategory?.subcategoryId}/fields/${editingField.fieldId}/options/${optionId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete option");
      
      const updatedField = {
        ...editingField,
        options: editingField.options?.filter(o => o.optionId !== optionId) || [],
      };
      setEditingField(updatedField);
      setFields(prev => prev.map(f => f.fieldId === editingField.fieldId ? updatedField : f));
      toast.success("Option deleted");
    } catch (error) {
      console.error("Failed to delete option:", error);
      toast.error("Failed to delete option");
    } finally {
      setSaving(false);
    }
  }

  // Filter subcategories
  const filteredSubcategories = subcategories.filter(sc => {
    const matchesSearch = search === "" || 
      sc.name.toLowerCase().includes(search.toLowerCase()) ||
      sc.categoryName?.toLowerCase().includes(search.toLowerCase());
    const matchesBarterType = barterTypeFilter === "all" || sc.barterTypeSlug === barterTypeFilter;
    return matchesSearch && matchesBarterType;
  });

  // Group by barter type
  const groupedSubcategories = filteredSubcategories.reduce((acc, sc) => {
    const key = sc.barterTypeName || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(sc);
    return acc;
  }, {} as Record<string, Subcategory[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-background p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Field Schema Builder</h1>
            <p className="text-sm text-muted-foreground">
              Define custom fields for product info by subcategory
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subcategories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={barterTypeFilter} onValueChange={setBarterTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Barter Types</SelectItem>
              {barterTypes.map(bt => (
                <SelectItem key={bt} value={bt!}>{bt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(groupedSubcategories).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No subcategories found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSubcategories).map(([barterType, subs]) => (
                <div key={barterType}>
                  <h2 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {barterType}
                  </h2>
                  <div className="grid gap-2">
                    {subs.map(sc => (
                      <button
                        key={sc.subcategoryId}
                        onClick={() => openDetail(sc)}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left w-full"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center">
                            <Layers className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{sc.name}</p>
                            <p className="text-xs text-muted-foreground">{sc.categoryName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {sc.productFields.length} fields
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl flex flex-col">
          <SheetHeader>
            <SheetTitle>{selectedSubcategory?.name}</SheetTitle>
            <SheetDescription>
              {selectedSubcategory?.categoryName} - {selectedSubcategory?.barterTypeName}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-hidden flex gap-4 mt-4">
            {/* Fields list */}
            <div className="w-1/2 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Product Fields</h3>
                <Button size="sm" variant="outline" onClick={handleAddField} disabled={saving}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              <ScrollArea className="flex-1 border rounded-md">
                <div className="p-2 space-y-1">
                  {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No fields defined
                    </p>
                  ) : (
                    fields.map(field => (
                      <button
                        key={field.fieldId}
                        onClick={() => setEditingField(field)}
                        className={`w-full flex items-center gap-2 p-2 rounded text-left text-sm hover:bg-accent/50 transition-colors ${
                          editingField?.fieldId === field.fieldId ? "bg-accent" : ""
                        }`}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{field.fieldLabel}</p>
                          <p className="text-xs text-muted-foreground">{field.fieldType}</p>
                        </div>
                        {field.isRequired && (
                          <Badge variant="secondary" className="text-[10px]">Required</Badge>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Field editor */}
            <div className="w-1/2 flex flex-col">
              {editingField ? (
                <Card className="flex-1 flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Edit Field</CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteField(editingField.fieldId)}
                        disabled={saving}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto space-y-4">
                    <div className="space-y-2">
                      <Label>Field Key</Label>
                      <Input
                        value={editingField.fieldKey}
                        onChange={(e) => setEditingField({ ...editingField, fieldKey: e.target.value })}
                        placeholder="e.g., ram_size"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={editingField.fieldLabel}
                        onChange={(e) => setEditingField({ ...editingField, fieldLabel: e.target.value })}
                        placeholder="e.g., RAM Size"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={editingField.fieldType}
                        onValueChange={(v) => setEditingField({ ...editingField, fieldType: v as FieldDefinition["fieldType"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map(ft => (
                            <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Placeholder</Label>
                      <Input
                        value={editingField.placeholder || ""}
                        onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Help Text</Label>
                      <Input
                        value={editingField.helpText || ""}
                        onChange={(e) => setEditingField({ ...editingField, helpText: e.target.value })}
                        placeholder="Enter help text"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Required</Label>
                      <Switch
                        checked={editingField.isRequired}
                        onCheckedChange={(v) => setEditingField({ ...editingField, isRequired: v })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Filterable</Label>
                      <Switch
                        checked={editingField.isFilterable}
                        onCheckedChange={(v) => setEditingField({ ...editingField, isFilterable: v })}
                      />
                    </div>

                    {/* Options for select type */}
                    {editingField.fieldType === "select" && (
                      <div className="space-y-2 pt-2 border-t">
                        <Label>Options</Label>
                        <div className="space-y-1">
                          {editingField.options?.map(opt => (
                            <div key={opt.optionId} className="flex items-center gap-2 text-sm">
                              <span className="flex-1 truncate">{opt.optionLabel}</span>
                              <span className="text-xs text-muted-foreground">({opt.optionValue})</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleDeleteOption(opt.optionId)}
                                disabled={saving}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Value"
                            value={newOptionValue}
                            onChange={(e) => setNewOptionValue(e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Label"
                            value={newOptionLabel}
                            onChange={(e) => setNewOptionLabel(e.target.value)}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={handleAddOption} disabled={saving || !newOptionValue || !newOptionLabel}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={() => handleUpdateField(editingField)} 
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Field
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">Select a field to edit</p>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="mt-4">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
