import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Database,
  ArrowRight,
} from 'lucide-react';
import { GymMember, AccessLogEntry } from '../utils/gymLogic';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMembersCount: number;
  currentLogsCount: number;
  onResetToDemoDefaults: () => void;
  onClearAllData: () => void;
}

export const ResetDataModal: React.FC<ResetDataModalProps> = ({
  isOpen,
  onClose,
  currentMembersCount,
  currentLogsCount,
  onResetToDemoDefaults,
  onClearAllData,
}) => {
  const [selectedOption, setSelectedOption] = useState<'demo' | 'empty'>('demo');
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleExecute = () => {
    if (selectedOption === 'demo') {
      onResetToDemoDefaults();
    } else {
      onClearAllData();
    }
    setIsConfirming(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-6 text-white text-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner mb-3">
            <Database className="w-8 h-8" />
          </div>

          <h2 id="reset-modal-title" className="text-lg font-bold text-white tracking-tight">
            Làm Sạch Dữ Liệu (Chuẩn Bị Nộp Đồ Án)
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            Hệ thống lưu vĩnh viễn toàn bộ hội viên bạn đăng ký. Khi cần nộp đồ án cho giảng viên hoặc đưa về trạng thái chuẩn, chọn phương án bên dưới.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Current Data Stats */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-900">Dữ liệu hiện tại trong máy:</span>
              <p className="text-slate-500 mt-0.5">
                <span className="font-bold text-slate-800">{currentMembersCount}</span> hội viên ·{' '}
                <span className="font-bold text-slate-800">{currentLogsCount}</span> lượt quẹt cổng
              </p>
            </div>
            <span className="text-[10px] px-2 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded-full border border-emerald-200">
              Đang lưu vĩnh viễn
            </span>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 block">
              Chọn phương án làm sạch để nộp đồ án:
            </label>

            {/* Option 1: Restore 7 standard demo members */}
            <div
              onClick={() => setSelectedOption('demo')}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                selectedOption === 'demo'
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="reset-option"
                  checked={selectedOption === 'demo'}
                  onChange={() => setSelectedOption('demo')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900">
                      Khôi phục 7 Hội Viên Mẫu Chuẩn (Khuyên dùng khi nộp)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">
                      Khuyên Dùng
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Xóa các hội viên rác thử nghiệm, đưa hệ thống về <strong>7 kịch bản hội viên chuẩn</strong> (VIP, Hết hạn, Sắp hết hạn, Thẻ đóng băng, Chưa đăng ký mặt) để giảng viên có thể chấm điểm ngay mọi tính năng.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2: Clean completely empty */}
            <div
              onClick={() => setSelectedOption('empty')}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                selectedOption === 'empty'
                  ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="reset-option"
                  checked={selectedOption === 'empty'}
                  onChange={() => setSelectedOption('empty')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900">
                      Xóa trắng hoàn toàn (Danh sách trống 0 hội viên)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Xóa toàn bộ hồ sơ hội viên và nhật ký ra vào. Hệ thống sẽ trống 100% để bạn tự thêm mới từng hội viên từ đầu trước mặt hội đồng.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Lưu ý trước khi thực hiện:</p>
              <p className="mt-0.5 text-amber-800">
                Hành động này sẽ làm sạch bộ nhớ trình duyệt (LocalStorage). Các hội viên bạn tự chụp ảnh trước đây sẽ được thay thế theo phương án bạn chọn.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy Bỏ (Giữ Nguyên Dữ Liệu)
            </button>

            <button
              type="button"
              onClick={handleExecute}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-red-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xác Nhận Làm Sạch Dữ Liệu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
