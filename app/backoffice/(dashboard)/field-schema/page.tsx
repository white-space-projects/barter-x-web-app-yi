"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, ChevronRight, Package, Layers, FileText, 
  Plus, X, Save, Loader2, GripVertical, Trash2, Copy
} from "lucide-react";
import { toast } from "sonner";

// Field definition type (matches repository)
interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "date" | "textarea";
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  defaultValue?: string | number | boolean;
  helpText?: string;
  order: number;
}

interface Subcategory {
  subcategoryId: string;
  categoryId: string;
  name: string;
  slug: string;
  productInfoFields: FieldDefinition[];
  offerInfoFields: FieldDefinition[];
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

function generateId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyField(order: number): FieldDefinition {
  return {
    id: generateId(),
    name: "",
    label: "",
    type: "text",
    required: false,
    order,
  };
}

export default function FieldSchemaPage() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [barterTypeFilter, setBarterTypeFilter] = useState<string>("all");
  
  // Detail panel state
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"product" | "offer">("product");
  
  // Field editing state
  const [productFields, setProductFields] = useState<FieldDefinition[]>([]);
  const [offerFields, setOfferFields] = useState<FieldDefinition[]>([]);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);

  // Unique barter types for filter
  const barterTypes = Array.from(new Set(subcategories.map(s => s.barterTypeSlug).filter(Boolean)));

  useEffect(() => {
    loadSubcategories();
  }, []);

  async function loadSubcategories() {
    setLoading(true);
    try {
      const response = await fetch("/api/data/subcategories");
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

  function openDetail(subcategory: Subcategory) {
    setSelectedSubcategory(subcategory);
    setProductFields([...subcategory.productInfoFields]);
    setOfferFields([...subcategory.offerInfoFields]);
    setActiveTab("product");
    setEditingField(null);
    setDetailOpen(true);
  }

  async function handleSave() {
    if (!selectedSubcategory) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/data/subcategories/${selectedSubcategory.subcategoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productInfoFields: productFields,
          offerInfoFields: offerFields,
        }),
      });

      if (!response.ok) throw new Error("Failed to save field schema");

      const data = await response.json();
      
      // Update local state
      setSubcategories(prev => 
        prev.map(s => s.subcategoryId === selectedSubcategory.subcategoryId ? data.subcategory : s)
      );
      setSelectedSubcategory(data.subcategory);
      
      toast.success("Field schema saved successfully");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save field schema");
    } finally {
      setSaving(false);
    }
  }

  function addField(type: "product" | "offer") {
    const fields = type === "product" ? productFields : offerFields;
    const setFields = type === "product" ? setProductFields : setOfferFields;
    const newField = createEmptyField(fields.length);
    setFields([...fields, newField]);
    setEditingField(newField);
  }

  function updateField(fieldId: string, updates: Partial<FieldDefinition>, type: "product" | "offer") {
    const setFields = type === "product" ? setProductFields : setOfferFields;
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f));
    if (editingField?.id === fieldId) {
      setEditingField(prev => prev ? { ...prev, ...updates } : null);
    }
  }

  function deleteField(fieldId: string, type: "product" | "offer") {
    const setFields = type === "product" ? setProductFields : setOfferFields;
    setFields(prev => prev.filter(f => f.id !== fieldId).map((f, i) => ({ ...f, order: i })));
    if (editingField?.id === fieldId) {
      setEditingField(null);
    }
  }

  function duplicateField(field: FieldDefinition, type: "product" | "offer") {
    const fields = type === "product" ? productFields : offerFields;
    const setFields = type === "product" ? setProductFields : setOfferFields;
    const newField: FieldDefinition = {
      ...field,
      id: generateId(),
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`,
      order: fields.length,
    };
    setFields([...fields, newField]);
  }

  // Filter subcategories
  const filteredSubcategories = subcategories.filter(s => {
    const matchesSearch = search === "" || 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.categoryName?.toLowerCase().includes(search.toLowerCase());
    const matchesBarterType = barterTypeFilter === "all" || s.barterTypeSlug === barterTypeFilter;
    return matchesSearch && matchesBarterType;
  });

  // Group by barter type and category
  const groupedSubcategories = filteredSubcategories.reduce((acc, s) => {
    const key = `${s.barterTypeName || "Unknown"} > ${s.categoryName || "Unknown"}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, Subcategory[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Field Schema Builder</h1>
          <p className="text-sm text-muted-foreground">
            Define dynamic fields for products and offers per subcategory
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subcategories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={barterTypeFilter} onValueChange={setBarterTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Barter Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Barter Types</SelectItem>
            {barterTypes.map(bt => (
              <SelectItem key={bt} value={bt!}>{bt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(groupedSubcategories).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Package className="h-12 w-12 mb-2 opacity-50" />
            <p>No subcategories found</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {Object.entries(groupedSubcategories).map(([group, subs]) => (
              <div key={group}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {group}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subs.map(subcategory => {
                    const productCount = subcategory.productInfoFields.length;
                    const offerCount = subcategory.offerInfoFields.length;
                    const hasFields = productCount > 0 || offerCount > 0;
                    
                    return (
                      <Card 
                        key={subcategory.subcategoryId}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => openDetail(subcategory)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center justify-between">
                            {subcategory.name}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 text-xs">
                            {hasFields ? (
                              <>
                                <Badge variant="secondary" className="text-xs">
                                  {productCount} product field{productCount !== 1 ? "s" : ""}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {offerCount} offer field{offerCount !== 1 ? "s" : ""}
                                </Badge>
                              </>
                            ) : (
                              <span className="text-muted-foreground">No fields defined</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedSubcategory && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedSubcategory.name}
                </SheetTitle>
                <SheetDescription>
                  {selectedSubcategory.barterTypeName} &gt; {selectedSubcategory.categoryName}
                </SheetDescription>
              </SheetHeader>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "product" | "offer")} className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="product">
                    Product Info Fields ({productFields.length})
                  </TabsTrigger>
                  <TabsTrigger value="offer">
                    Offer Info Fields ({offerFields.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="product" className="mt-4 space-y-4">
                  <FieldList
                    fields={productFields}
                    type="product"
                    editingField={editingField}
                    onEdit={setEditingField}
                    onUpdate={(id, updates) => updateField(id, updates, "product")}
                    onDelete={(id) => deleteField(id, "product")}
                    onDuplicate={(field) => duplicateField(field, "product")}
                    onAdd={() => addField("product")}
                  />
                </TabsContent>

                <TabsContent value="offer" className="mt-4 space-y-4">
                  <FieldList
                    fields={offerFields}
                    type="offer"
                    editingField={editingField}
                    onEdit={setEditingField}
                    onUpdate={(id, updates) => updateField(id, updates, "offer")}
                    onDelete={(id) => deleteField(id, "offer")}
                    onDuplicate={(field) => duplicateField(field, "offer")}
                    onAdd={() => addField("offer")}
                  />
                </TabsContent>
              </Tabs>

              <SheetFooter className="mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Schema
                    </>
                  )}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Field List Component
function FieldList({
  fields,
  type,
  editingField,
  onEdit,
  onUpdate,
  onDelete,
  onDuplicate,
  onAdd,
}: {
  fields: FieldDefinition[];
  type: "product" | "offer";
  editingField: FieldDefinition | null;
  onEdit: (field: FieldDefinition | null) => void;
  onUpdate: (id: string, updates: Partial<FieldDefinition>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (field: FieldDefinition) => void;
  onAdd: () => void;
}) {
  if (fields.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed rounded-lg">
        <p className="text-muted-foreground mb-3">No fields defined yet</p>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add First Field
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.id}>
          {editingField?.id === field.id ? (
            <FieldEditor
              field={field}
              onUpdate={(updates) => onUpdate(field.id, updates)}
              onClose={() => onEdit(null)}
              onDelete={() => onDelete(field.id)}
            />
          ) : (
            <div 
              className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => onEdit(field)}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {field.label || field.name || "Untitled Field"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                  {field.required && " • Required"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); onDuplicate(field); }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete(field.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      <Button variant="outline" size="sm" onClick={onAdd} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Field
      </Button>
    </div>
  );
}

// Field Editor Component
function FieldEditor({
  field,
  onUpdate,
  onClose,
  onDelete,
}: {
  field: FieldDefinition;
  onUpdate: (updates: Partial<FieldDefinition>) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [optionsText, setOptionsText] = useState(field.options?.join("\n") || "");

  return (
    <Card className="border-primary">
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Field Name (key)</Label>
            <Input
              value={field.name}
              onChange={(e) => onUpdate({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
              placeholder="e.g., storage_capacity"
            />
          </div>
          <div className="space-y-2">
            <Label>Display Label</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="e.g., Storage Capacity"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Field Type</Label>
            <Select value={field.type} onValueChange={(v) => onUpdate({ type: v as FieldDefinition["type"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Placeholder</Label>
            <Input
              value={field.placeholder || ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Optional placeholder text"
            />
          </div>
        </div>

        {field.type === "select" && (
          <div className="space-y-2">
            <Label>Options (one per line)</Label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md bg-background"
              value={optionsText}
              onChange={(e) => {
                setOptionsText(e.target.value);
                onUpdate({ options: e.target.value.split("\n").filter(o => o.trim()) });
              }}
              placeholder={"Option 1\nOption 2\nOption 3"}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Help Text (optional)</Label>
          <Input
            value={field.helpText || ""}
            onChange={(e) => onUpdate({ helpText: e.target.value })}
            placeholder="Additional guidance for users"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
            <Label className="cursor-pointer">Required field</Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
