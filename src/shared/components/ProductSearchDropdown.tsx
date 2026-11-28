import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Package } from 'lucide-react';

export interface CatalogProduct {
  id?: string | number;
  name: string;
  code?: string;
  genericName?: string;
  brandName?: string;
  category?: string;
  ptr?: string | number;
  mrp?: string | number;
  gst?: string | number;
  rate?: number;
  gstPercent?: number;
}

interface ProductSearchDropdownProps {
  value: string;
  onChangeName: (name: string) => void;
  onSelectProduct: (product: {
    name: string;
    code: string;
    rate: number;
    gstPercent: number;
  }) => void;
  catalog: CatalogProduct[];
  placeholder?: string;
  required?: boolean;
}

export function ProductSearchDropdown({
  value,
  onChangeName,
  onSelectProduct,
  catalog = [],
  placeholder = 'Search by medicine name, code, or brand...',
  required = false
}: ProductSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!catalog || catalog.length === 0) return [];
    const query = (value || '').trim().toLowerCase();
    if (!query) {
      // Show all (limit to first 60 for performance)
      return catalog.slice(0, 60);
    }
    return catalog.filter((p) => {
      const matchName = p.name && p.name.toLowerCase().includes(query);
      const matchCode = p.code && p.code.toLowerCase().includes(query);
      const matchGen = p.genericName && p.genericName.toLowerCase().includes(query);
      const matchBrand = p.brandName && p.brandName.toLowerCase().includes(query);
      const matchCat = p.category && p.category.toLowerCase().includes(query);
      return matchName || matchCode || matchGen || matchBrand || matchCat;
    }).slice(0, 60);
  }, [catalog, value]);

  const handleSelect = (p: CatalogProduct) => {
    const rateVal = Number(p.ptr || p.rate || p.mrp || 100);
    const gstVal = Number(p.gst || p.gstPercent || 12);
    onSelectProduct({
      name: p.name,
      code: p.code || 'PRD-01',
      rate: isNaN(rateVal) ? 100 : rateVal,
      gstPercent: isNaN(gstVal) ? 12 : gstVal
    });
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChangeName(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full text-xs border border-slate-300 rounded-lg p-2.5 pr-8 focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] transition-all bg-white"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          tabIndex={-1}
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180 text-[#163c78]' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
          <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Search className="w-3 h-3 text-slate-400" />
              {value ? `Matching Results (${filteredProducts.length})` : `Available Medicines (${filteredProducts.length})`}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Click to select</span>
          </div>

          {filteredProducts.length > 0 ? (
            filteredProducts.map((p, idx) => {
              const rateVal = Number(p.ptr || p.rate || p.mrp || 100);
              const gstVal = Number(p.gst || p.gstPercent || 12);
              const isSelected = value && value.toLowerCase() === p.name.toLowerCase();

              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(p)}
                  className={`p-2.5 hover:bg-blue-50/80 cursor-pointer transition-colors flex items-center justify-between text-xs ${
                    isSelected ? 'bg-blue-50/60 font-semibold text-[#163c78]' : 'text-slate-800'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 block truncate">{p.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      {p.code && (
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 border border-slate-200">
                          {p.code}
                        </span>
                      )}
                      {p.genericName && <span className="truncate max-w-[180px]">{p.genericName}</span>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 block">₹{rateVal.toFixed(2)}</span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      {gstVal}% GST
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 space-y-1">
              <Package className="w-5 h-5 text-slate-300 mx-auto" />
              <p className="font-medium text-slate-700">No matching medicines found</p>
              <p className="text-[11px] text-slate-400">
                You can keep typing to enter a custom medicine name manually.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
