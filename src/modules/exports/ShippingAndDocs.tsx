import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Upload, File, CheckCircle } from 'lucide-react';
import { apiRequest } from '../../services/apiClient';

const ShippingAndDocs = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [uploadData, setUploadData] = useState({ orderId: '', documentType: 'Commercial Invoice' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await apiRequest<{success: boolean, data: any[]}>('/exports/orders');
      if (res.success) {
        setOrders(res.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('orderId', uploadData.orderId);
    formData.append('documentType', uploadData.documentType);

    try {
      const res = await apiRequest<{success: boolean}>('/exports/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.success) {
        setSelectedFile(null);
        alert('File uploaded successfully');
      } else {
        alert('File upload failed');
      }
    } catch (error) {
      console.error(error);
      alert('File upload failed');
    }
    setUploading(false);
  };

  const activeOrders = orders.filter(o => ['Processing', 'Shipped'].includes(o.status));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Shipping & Documentation</h1>
          <p className="text-slate-500">Coordinate shipments, map HS codes, and upload FDA/GMP documentation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 font-semibold text-sm text-slate-600">Order No</th>
                      <th className="py-3 px-4 font-semibold text-sm text-slate-600">Destination</th>
                      <th className="py-3 px-4 font-semibold text-sm text-slate-600">Mode</th>
                      <th className="py-3 px-4 font-semibold text-sm text-slate-600">Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">No active shipments to display</td>
                      </tr>
                    ) : (
                      activeOrders.map(o => (
                        <tr key={o.id} className="border-b border-slate-50">
                          <td className="py-3 px-4 text-sm text-slate-800 font-medium">{o.orderNumber}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{o.destinationPort || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{o.shippingMode}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{o.documents?.length || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Order Number</label>
                <select 
                  className="w-full border border-slate-300 rounded-md p-2 text-sm"
                  value={uploadData.orderId}
                  onChange={e => setUploadData({ ...uploadData, orderId: e.target.value })}
                >
                  <option value="">Select an active order...</option>
                  {activeOrders.map(o => (
                    <option key={o.id} value={o.id}>{o.orderNumber}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Document Type</label>
                <select 
                  className="w-full border border-slate-300 rounded-md p-2 text-sm"
                  value={uploadData.documentType}
                  onChange={e => setUploadData({ ...uploadData, documentType: e.target.value })}
                >
                  <option value="Commercial Invoice">Commercial Invoice</option>
                  <option value="Packing List">Packing List</option>
                  <option value="Bill of Lading">Bill of Lading</option>
                  <option value="FDA Certificate">FDA Certificate</option>
                  <option value="GMP Certificate">GMP Certificate</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">File</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    {selectedFile ? (
                      <>
                        <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                        <span className="text-sm text-slate-600 font-medium">{selectedFile.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-600">Click to upload or drag and drop</span>
                        <span className="text-xs text-slate-400 mt-1">PDF, PNG, JPG up to 10MB</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <Button 
                className="w-full flex items-center justify-center gap-2" 
                disabled={!selectedFile || !uploadData.orderId || uploading}
                onClick={handleUpload}
              >
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShippingAndDocs;
