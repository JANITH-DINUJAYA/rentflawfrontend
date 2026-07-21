"use client";

import React from "react";
import { Search, Printer, FileText, Download, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterOption {
  label: string;
  value: string;
}

interface TableExportControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  tableData: any[];
  columns?: { key: string; label: string }[];
  filename?: string;
  title?: string;
}

export function TableExportControls({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filterValue,
  onFilterChange,
  filterOptions = [],
  filterLabel = "All Categories",
  tableData = [],
  columns = [],
  filename = "rentflaw_export",
  title = "Report",
}: TableExportControlsProps) {
  
  // ─── Export to Excel (.csv) ──────────────────────────
  const handleExportExcel = () => {
    if (!tableData || tableData.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Auto-detect keys if columns are not provided
    const keys = columns.length > 0
      ? columns.map(c => c.key)
      : Object.keys(tableData[0]).filter(k => typeof tableData[0][k] !== "object");

    const headers = columns.length > 0
      ? columns.map(c => c.label)
      : keys.map(k => k.replace(/_/g, " ").toUpperCase());

    const csvRows: string[] = [];
    csvRows.push(headers.join(","));

    tableData.forEach(row => {
      const values = keys.map(key => {
        const val = row[key];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      });
      csvRows.push(values.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Print View ──────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  // ─── Export PDF (Print to PDF trigger) ───────────────
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-accent/10 border border-border rounded-2xl mb-4 print:hidden">
      {/* Search Bar */}
      <div className="flex items-center gap-2 flex-1 min-w-[220px]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Filter Dropdown */}
        {onFilterChange && filterOptions.length > 0 && (
          <div className="w-44">
            <Select value={filterValue || "ALL"} onValueChange={(val) => val && onFilterChange(val)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={filterLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{filterLabel}</SelectItem>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Export & Print Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handlePrint}
          title="Print Document"
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-border bg-card text-foreground hover:bg-accent text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print</span>
        </button>

        <button
          onClick={handleExportPDF}
          title="Export as PDF"
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-border bg-card text-foreground hover:bg-accent text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5 text-red-500" />
          <span>Export PDF</span>
        </button>

        <button
          onClick={handleExportExcel}
          title="Export to Excel (.csv)"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Excel (.csv)</span>
        </button>
      </div>
    </div>
  );
}
