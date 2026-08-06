import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, User, Shield, Users, Eye, X } from 'lucide-react';
import { salesOrganizationService } from '../../../services/salesOrganizationService';
import type { OrganizationNode } from './types';
import { SearchInput, ActionButton, Badge, FilterBar } from '../components/shared';

export default function OrganizationTab() {
  const [treeData, setTreeData] = useState<OrganizationNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'root-owner': true,
  });
  const [selectedNode, setSelectedNode] = useState<OrganizationNode | null>(null);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const data = await salesOrganizationService.getOrganizationTree();
        setTreeData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const handleExpandAll = () => {
    if (!treeData || treeData.length === 0) return;
    const newExpanded: Record<string, boolean> = {};
    const traverse = (node: OrganizationNode) => {
      newExpanded[node.id] = true;
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    treeData.forEach(traverse);
    setExpandedNodes(newExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedNodes({ 'root-owner': true });
  };

  // Helper to check if a node or any of its children match search
  const matchesSearch = (node: OrganizationNode, query: string): boolean => {
    if (!query) return true;
    const q = query.toLowerCase();
    if (
      node.employeeName.toLowerCase().includes(q) ||
      node.employeeCode.toLowerCase().includes(q) ||
      node.designation.toLowerCase().includes(q) ||
      node.area.toLowerCase().includes(q)
    ) {
      return true;
    }
    return node.children.some((c) => matchesSearch(c, query));
  };

  const renderTreeNode = (node: OrganizationNode, depth = 0) => {
    if (search && !matchesSearch(node, search)) {
      return null;
    }

    const isExpanded = expandedNodes[node.id] ?? false;
    const hasChildren = node.children.length > 0;
    const isRoot = node.id === 'root-owner';

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => setSelectedNode(node)}
          className={`flex items-center gap-3 py-2 px-3 my-1 rounded-xl border transition-all cursor-pointer ${
            selectedNode?.id === node.id
              ? 'bg-[#163c78]/10 border-violet-300 ring-2 ring-violet-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {/* Toggle icon */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-6" />
          )}

          {/* Role Icon */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isRoot
                ? 'bg-amber-100 text-amber-700'
                : node.designation === 'National Sales Head'
                ? 'bg-indigo-100 text-indigo-700'
                : node.designation === 'Zonal Sales Manager'
                ? 'bg-blue-100 text-blue-700'
                : node.designation === 'Regional Sales Manager'
                ? 'bg-cyan-100 text-cyan-700'
                : node.designation === 'Area Sales Manager'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isRoot ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 truncate">{node.employeeName}</span>
              <span className="text-xs font-mono text-slate-400">({node.employeeCode})</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-[#163c78]">{node.designation}</span>
              {node.area && <span>• {node.area}</span>}
            </div>
          </div>

          {/* Children count badge */}
          {hasChildren && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {node.children.length} direct
            </span>
          )}

          <Badge variant={node.status === 'Active' ? 'success' : 'neutral'}>{node.status}</Badge>
        </div>

        {/* Recursive Children */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading organization tree...</div>;
  }

  if (!treeData || treeData.length === 0) {
    return <div className="p-8 text-center text-rose-500">Failed to load tree data.</div>;
  }

  return (
    <div>
      {/* Controls Bar */}
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search hierarchy by name, code..." />
        <ActionButton variant="secondary" onClick={handleExpandAll}>
          Expand All
        </ActionButton>
        <ActionButton variant="secondary" onClick={handleCollapseAll}>
          Collapse All
        </ActionButton>
      </FilterBar>

      {/* Main Layout: Tree View (Left) + Details Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hierarchy Tree */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm min-h-[500px] max-h-[750px] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Organization Hierarchy Tree
            </h3>
            <span className="text-xs text-slate-400">Click any employee to view details</span>
          </div>

          {treeData.map((node) => (
            <div key={node.id}>
              {renderTreeNode(node)}
            </div>
          ))}
        </div>

        {/* Details Side Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          {selectedNode ? (
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedNode.employeeName}</h3>
                  <p className="text-xs font-mono text-slate-400">{selectedNode.employeeCode}</p>
                </div>
                <Badge variant={selectedNode.status === 'Active' ? 'success' : 'neutral'}>
                  {selectedNode.status}
                </Badge>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Designation
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-violet-50 text-[#163c78] border border-violet-200">
                    {selectedNode.designation}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Reports To
                  </span>
                  <span className="font-semibold text-slate-800">{selectedNode.reportsTo || 'N/A'}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Zone
                    </span>
                    <span className="text-slate-700 font-medium">{selectedNode.zone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Region
                    </span>
                    <span className="text-slate-700 font-medium">{selectedNode.region || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Assigned Area / HQ
                  </span>
                  <span className="text-slate-700 font-medium">{selectedNode.area || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Direct Reportees
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                    <Users className="w-4 h-4 text-slate-500" />
                    {selectedNode.children.length} Team Members
                  </span>
                </div>
              </div>

              {/* Action Buttons (Read-Only Actions as specified) */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <ActionButton
                  variant="secondary"
                  icon={<Eye className="w-4 h-4" />}
                  onClick={() =>
                    alert(`Employee Profile View: ${selectedNode.employeeName} (${selectedNode.employeeCode})`)
                  }
                >
                  View Employee Profile
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  icon={<Users className="w-4 h-4" />}
                  onClick={() =>
                    alert(
                      `Direct Team (${selectedNode.children.length}):\n` +
                        selectedNode.children.map((c) => `- ${c.employeeName} (${c.designation})`).join('\n')
                    )
                  }
                >
                  View Direct Team
                </ActionButton>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <User className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
              <p className="text-sm font-medium">Select an employee from the hierarchy tree to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
