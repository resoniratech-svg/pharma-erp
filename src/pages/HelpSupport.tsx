import { motion } from 'framer-motion';
import { LifeBuoy, Mail, Phone, Book, FileText, MessageSquare, ExternalLink, HelpCircle } from 'lucide-react';

export default function HelpSupport() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Help & Support</h1>
        <p className="text-slate-500 text-sm mt-1">Get assistance, read documentation, and track your support tickets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Contact & Info */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="bg-indigo-600 px-6 py-8 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <LifeBuoy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold">How can we help?</h2>
              <p className="text-indigo-100 text-sm mt-2">Our support team is available 24/7</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Phone Support</h4>
                  <p className="text-xs text-slate-500 mb-1">Toll-free, 24/7</p>
                  <a href="tel:18001234567" className="text-sm font-semibold text-primary hover:underline">1800-123-4567</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Email Support</h4>
                  <p className="text-xs text-slate-500 mb-1">Response within 2 hours</p>
                  <a href="mailto:support@pharmaerp.com" className="text-sm font-semibold text-primary hover:underline">support@pharmaerp.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Live Chat</h4>
                  <p className="text-xs text-slate-500 mb-1">Available during business hours</p>
                  <button className="text-sm font-semibold text-primary hover:underline">Start a chat</button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800 rounded-xl shadow-sm p-6 text-white"
          >
            <h3 className="font-bold mb-2">System Information</h3>
            <div className="space-y-2 mt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">ERP Version</span>
                <span className="font-semibold">v2.4.1 (Stable)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Update</span>
                <span className="font-semibold">05-June-2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Environment</span>
                <span className="font-semibold text-emerald-400">Production</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Documentation & Tickets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Guides */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <a href="#" className="bg-white p-5 rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all group flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                <Book className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors">User Manual</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">Complete guide to using all modules in Pharma ERP.</p>
              </div>
            </a>
            
            <a href="#" className="bg-white p-5 rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all group flex items-start gap-4">
              <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
                <HelpCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors">FAQs</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">Find answers to commonly asked questions.</p>
              </div>
            </a>
          </motion.div>

          {/* Ticket System */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-800">Support Tickets</h3>
              </div>
              <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                Raise New Ticket
              </button>
            </div>
            
            <div className="divide-y divide-slate-100">
              <div className="p-6 flex items-start justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Issue with E-Way Bill generation</h4>
                    <p className="text-xs text-slate-500 mt-1">Ticket #TCK-9021 • Opened 2 days ago</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-100">
                  Resolved
                </span>
              </div>

              <div className="p-6 flex items-start justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Cannot access Product Catalog</h4>
                    <p className="text-xs text-slate-500 mt-1">Ticket #TCK-9144 • Opened 4 hours ago</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-100">
                  In Progress
                </span>
              </div>

              <div className="p-6 text-center">
                <button className="text-sm font-semibold text-primary hover:text-indigo-700 flex items-center justify-center gap-2 mx-auto">
                  View All Tickets
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
