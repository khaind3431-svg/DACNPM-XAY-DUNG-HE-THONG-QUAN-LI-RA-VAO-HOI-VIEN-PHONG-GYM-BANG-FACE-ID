import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  ShieldCheck,
  ShieldAlert,
  Filter,
} from 'lucide-react';
import { AccessLogEntry } from '../utils/gymLogic';

interface AccessLogsViewProps {
  accessLogs: AccessLogEntry[];
}

export const AccessLogsView: React.FC<AccessLogsViewProps> = ({ accessLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | 'granted' | 'denied'>('all');
  const [gateFilter, setGateFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return accessLogs.filter((log) => {
      if (resultFilter === 'granted' && log.result !== 'granted') return false;
      if (resultFilter === 'denied' && log.result === 'granted') return false;
      if (gateFilter !== 'all' && log.gateId !== gateFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        log.memberName.toLowerCase().includes(q) ||
        log.memberCode.toLowerCase().includes(q) ||
        log.reasonVi.toLowerCase().includes(q) ||
        log.gateId.toLowerCase().includes(q)
      );
    });
  }, [accessLogs, resultFilter, gateFilter, searchQuery]);

  const handleExportCsv = () => {
    const headers = [
      'Mã Sự Kiện',
      'Thời Gian',
      'Cổng Kiểm Soát',
      'Chiều',
      'Mã Hội Viên',
      'Họ Tên',
      'Độ Khớp (%)',
      'Thực Thể (%)',
      'Kết Quả',
      'Lý Do Chi Tiết',
    ];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.gateId,
      l.direction,
      l.memberCode,
      `"${l.memberName}"`,
      l.similarityScore.toFixed(1),
      l.livenessScore.toFixed(1),
      l.result === 'granted' ? 'HOP_LE' : 'TU_CHOI',
      `"${l.reasonVi}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nhat-ky-ra-vao-titanfit-2026-10-17.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const grantedCount = accessLogs.filter((l) => l.result === 'granted').length;
  const deniedCount = accessLogs.length - grantedCount;

  return (
    <div className="space-y-5">
      {/* Filter & Export Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <label htmlFor="log-search-input" className="sr-only">
                Tìm kiếm nhật ký ra vào
              </label>
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="log-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên hội viên, mã thẻ, lý do từ chối..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label htmlFor="gate-filter-select" className="sr-only">
                Lọc theo cổng
              </label>
              <select
                id="gate-filter-select"
                value={gateFilter}
                onChange={(e) => setGateFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Tất cả làn cổng (3 cổng)</option>
                <option value="Cổng A1 - Lối Vào Chính">Cổng A1 - Lối Vào Chính</option>
                <option value="Cổng A2 - Khu VIP & PT">Cổng A2 - Khu VIP & PT</option>
                <option value="Cổng B1 - Lối Ra">Cổng B1 - Lối Ra</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Lọc theo kết quả kiểm soát"
              className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
            >
              <button
                type="button"
                onClick={() => setResultFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  resultFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({accessLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setResultFilter('granted')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  resultFilter === 'granted'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mở cổng hợp lệ ({grantedCount})
              </button>
              <button
                type="button"
                onClick={() => setResultFilter('denied')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  resultFilter === 'denied'
                    ? 'bg-white text-red-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cảnh báo / Từ chối ({deniedCount})
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Báo Cáo CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              Không có bản ghi nhật ký nào khớp với điều kiện lọc
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setResultFilter('all');
                setGateFilter('all');
              }}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 hover:underline"
            >
              Đặt lại toàn bộ bộ lọc
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-3 px-4">Thời Gian Quét</th>
                  <th className="py-3 px-4">Làn Cổng & Chiều</th>
                  <th className="py-3 px-4">Hội Viên / Đối Tượng</th>
                  <th className="py-3 px-4 text-right">Độ Khớp Vector</th>
                  <th className="py-3 px-4 text-right">Thực Thể IR</th>
                  <th className="py-3 px-4 text-right">Độ Trễ Xử Lý</th>
                  <th className="py-3 px-4">Trạng Thái & Nguyên Nhân</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-800">
                      <span>{log.gateId}</span>
                      <span className="mx-1.5 text-slate-400">·</span>
                      <span className="font-mono font-semibold">
                        {log.direction === 'IN' ? 'VÀO' : 'RA'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.memberName}</div>
                      <div className="text-slate-500 font-mono tabular-nums">
                        {log.memberCode} · {log.packageName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {log.similarityScore.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {log.livenessScore.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                      {log.processingMs} ms
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {log.result === 'granted' ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                        <span
                          className={`font-medium ${
                            log.result === 'granted' ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {log.reasonVi}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
