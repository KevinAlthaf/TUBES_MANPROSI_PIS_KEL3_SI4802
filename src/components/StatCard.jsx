import React from 'react';

export default function StatCard({ title, count, illustrationType }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <h3 className="text-4xl font-bold text-gray-900 mb-1">{count}</h3>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
      </div>
      <div className="w-24 h-24 relative flex items-center justify-center">
        {/* Simplified placeholders for illustrations */}
        {illustrationType === 'new' && (
          <div className="relative">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
               <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
          </div>
        )}
        {illustrationType === 'unprocessed' && (
           <div className="relative">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
