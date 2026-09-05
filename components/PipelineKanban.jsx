import { useState, useEffect } from "react";
import { quotations } from "../mockData.js";

const STATUS_ORDER = ["Draft", "Pending Approval", "Negotiation", "Confirmed"];

export default function PipelineKanban() {
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Filter quotations based on search term
    if (searchTerm.trim() === "") {
      setFilteredQuotations(quotations);
    } else {
      const filtered = quotations.filter(q =>
        q.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.id.toString().includes(searchTerm)
      );
      setFilteredQuotations(filtered);
    }
  }, [searchTerm]);

  // Initialize with all quotations
  useEffect(() => {
    setFilteredQuotations(quotations);
  }, []);

  // Group quotations by status
  const columns = STATUS_ORDER.map((status) => ({
    status,
    items: filteredQuotations.filter((q) => q.status === status),
  }));

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft": return "bg-blue-100 border-blue-300";
      case "Pending Approval": return "bg-yellow-100 border-yellow-300";
      case "Negotiation": return "bg-orange-100 border-orange-300";
      case "Confirmed": return "bg-green-100 border-green-300";
      default: return "bg-gray-100 border-gray-300";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "Draft": return "text-blue-800";
      case "Pending Approval": return "text-yellow-800";
      case "Negotiation": return "text-orange-800";
      case "Confirmed": return "text-green-800";
      default: return "text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600">Track and manage all quotations in real-time</p>
        </div>
        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by customer or ID..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            New Quotation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((col) => (
          <div key={col.status} className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className={`p-4 border-b ${getStatusColor(col.status)}`}>
              <div className="flex justify-between items-center">
                <h3 className={`font-semibold ${getStatusTextColor(col.status)}`}>
                  {col.status}
                </h3>
                <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                  {col.items.length}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-4 min-h-[400px]">
              {col.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2">No quotations</p>
                </div>
              ) : (
                col.items.map((quote) => (
                  <div
                    key={quote.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">#{quote.id}</div>
                        <div className="text-sm font-medium text-gray-900">{quote.customer_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">${quote.total_price.toLocaleString()}</div>
                        {quote.blended_risk_score > 0 && (
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            quote.blended_risk_score > 30 ? 'bg-red-100 text-red-800' :
                            quote.blended_risk_score > 15 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            Risk: {quote.blended_risk_score}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      {quote.lines.length} item{quote.lines.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        {new Date(quote.created_at).toLocaleDateString()}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 font-medium">
                        View Details →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Pipeline Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{quotations.length}</div>
            <div className="text-sm text-gray-600">Total Quotes</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">
              ${quotations.reduce((sum, q) => sum + q.total_price, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">
              {quotations.filter(q => q.status === "Pending Approval").length}
            </div>
            <div className="text-sm text-gray-600">Pending Approval</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {quotations.filter(q => q.status === "Confirmed").length}
            </div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </div>
        </div>
      </div>
    </div>
  );
}