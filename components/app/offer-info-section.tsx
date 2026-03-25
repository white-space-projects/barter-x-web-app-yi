"use client";

import { useState, useMemo, useRef } from "react";
import { ChevronRight, ChevronDown, Plus, X, Info, Calendar, Check, Upload } from "lucide-react";
import type { OfferInfoFieldValue, OfferInfoFieldDefinition } from "@/lib/types";
import { getOfferInfoFieldsForSubcategory } from "@/lib/offer-info-fields";

type Props = {
  subcategory: string;
  values: OfferInfoFieldValue[];
  onChange: (values: OfferInfoFieldValue[]) => void;
  readOnly?: boolean;
};

export function OfferInfoSection({ subcategory, values = [], onChange, readOnly = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  
  // Ensure values is always an array
  const safeValues = values || [];
  
  // Get field definitions for this subcategory
  const fieldDefinitions = useMemo(() => getOfferInfoFieldsForSubcategory(subcategory), [subcategory]);
  
  // Count filled fields
  const filledCount = safeValues.filter(v => {
    if (Array.isArray(v.value)) return v.value.length > 0;
    return v.value && v.value.trim() !== "";
  }).length;

  // Get current value for a field
  function getFieldValue(fieldId: string): OfferInfoFieldValue | undefined {
    return safeValues.find(v => v.fieldId === fieldId);
  }

  // Update a field value
  function updateFieldValue(field: OfferInfoFieldDefinition, value: string | string[] | null) {
    const existing = safeValues.findIndex(v => v.fieldId === field.fieldId);
    const newValue: OfferInfoFieldValue = {
      fieldId: field.fieldId,
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      value,
    };
    
    if (existing >= 0) {
      const newValues = [...safeValues];
      newValues[existing] = newValue;
      onChange(newValues);
    } else {
      onChange([...safeValues, newValue]);
    }
  }

  // Toggle multi-select option
  function toggleMultiOption(field: OfferInfoFieldDefinition, option: string) {
    const current = getFieldValue(field.fieldId);
    const currentArray = (current?.value as string[]) || [];
    
    if (currentArray.includes(option)) {
      updateFieldValue(field, currentArray.filter(o => o !== option));
    } else {
      updateFieldValue(field, [...currentArray, option]);
    }
  }

  // Render a field row
  function renderField(field: OfferInfoFieldDefinition) {
    const currentValue = getFieldValue(field.fieldId);
    const isFieldExpanded = expandedFieldId === field.fieldId;
    
    // Display value
    let displayValue = "Not specified";
    if (currentValue?.value) {
      if (Array.isArray(currentValue.value)) {
        displayValue = currentValue.value.length > 0 ? currentValue.value.join(", ") : "None selected";
      } else {
        displayValue = currentValue.value;
      }
    }

    if (readOnly) {
      return (
        <div key={field.fieldId} className="flex justify-between items-start py-3 border-b border-border/50 last:border-0">
          <span className="text-sm text-muted-foreground">{field.fieldName}</span>
          <span className="text-sm text-foreground text-right max-w-[60%]">{displayValue}</span>
        </div>
      );
    }

    return (
      <div key={field.fieldId} className="border-b border-border/50 last:border-0">
        <button
          type="button"
          onClick={() => setExpandedFieldId(isFieldExpanded ? null : field.fieldId)}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <span className="text-sm text-foreground">{field.fieldName}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground truncate max-w-[150px]">
              {displayValue}
            </span>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isFieldExpanded ? "rotate-90" : ""}`} />
          </div>
        </button>
        
        {isFieldExpanded && (
          <div className="pb-3 pl-2 pr-2">
            {field.fieldType === "text" && (
              <input
                type="text"
                value={(currentValue?.value as string) || ""}
                onChange={(e) => updateFieldValue(field, e.target.value)}
                placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
                className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
            
            {field.fieldType === "date_select" && (
              <div className="flex gap-2">
                <select
                  value={currentValue?.value ? (currentValue.value as string).split("/")[0] : ""}
                  onChange={(e) => {
                    const currentYear = currentValue?.value ? (currentValue.value as string).split("/")[1] : new Date().getFullYear().toString();
                    updateFieldValue(field, e.target.value ? `${e.target.value}/${currentYear}` : null);
                  }}
                  className="flex-1 rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {new Date(2000, i).toLocaleString("default", { month: "long" })}
                    </option>
                  ))}
                </select>
                <select
                  value={currentValue?.value ? (currentValue.value as string).split("/")[1] : ""}
                  onChange={(e) => {
                    const currentMonth = currentValue?.value ? (currentValue.value as string).split("/")[0] : "01";
                    updateFieldValue(field, e.target.value ? `${currentMonth}/${e.target.value}` : null);
                  }}
                  className="flex-1 rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Year</option>
                  {Array.from({ length: 15 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
            )}
            
            {field.fieldType === "single_select" && field.options && (
              <div className="flex flex-wrap gap-2">
                {field.options.map((option) => {
                  const isSelected = currentValue?.value === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateFieldValue(field, isSelected ? null : option)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
            
            {field.fieldType === "multi_select" && field.options && (
              <div className="flex flex-wrap gap-2">
                {field.options.map((option) => {
                  const isSelected = ((currentValue?.value as string[]) || []).includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleMultiOption(field, option)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
            
            {field.fieldType === "attachment" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Upload documents like invoice, warranty card, certificates
                </p>
                <label className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-dashed border-input bg-secondary/50 text-sm text-muted-foreground cursor-pointer hover:bg-secondary transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Upload Document</span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">Offer Info</h4>
            <p className="text-xs text-muted-foreground">
              {filledCount > 0 ? `${filledCount} fields filled` : "Optional details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              {fieldDefinitions.length} fields
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      
      {/* Fields */}
      {isExpanded && (
        <div className="border-t border-border px-4 pb-2">
          {fieldDefinitions.map(field => renderField(field))}
        </div>
      )}
    </div>
  );
}
