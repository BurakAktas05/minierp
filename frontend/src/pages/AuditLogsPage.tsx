import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, RefreshCw, Eye, AlertCircle } from 'lucide-react';
import { auditApi } from '../api/auditApi';
import { AuditLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { Card } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { getTurkishStatusLabel } from '../components/common/StatusBadge';

export const AuditLogsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await auditApi.getAllLogs();
      setLogs(list);
    } catch (err) {
      console.error('Audit logları yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-slate-200 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h2 className="text-base font-bold text-slate-900">Erişim Yetkisi Yok</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Sistem denetim günlüğü (Audit Log) yalnızca <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">ROLE_ADMIN</code> yetkisine sahip kullanıcılar tarafından görüntülenebilir.
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter(
    (l) =>
      l.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entityType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sistem Denetim Günlüğü (Audit Log)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kullanıcı aktiviteleri, veri değişiklikleri ve RabbitMQ durum geçişlerinin izleme kaydı
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yenile</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Kullanıcı adı, aksiyon veya varlık türü (Order, Waybill) ara..."
            className="pl-9 text-xs"
          />
        </div>
      </Card>

      {/* Audit Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zaman Damgası</TableHead>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Aksiyon</TableHead>
              <TableHead>İlgili Varlık</TableHead>
              <TableHead>Değişim (Eski &rarr; Yeni)</TableHead>
              <TableHead>IP Adresi</TableHead>
              <TableHead className="text-right">Detay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('tr-TR')}
                </TableCell>
                <TableCell className="font-semibold text-xs text-slate-900">
                  {log.username}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                    {log.action}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-700">
                  {log.entityType} #{log.entityId}
                </TableCell>
                <TableCell className="text-xs">
                  {log.oldValue || log.newValue ? (
                    <span className="font-mono text-[11px] text-slate-600">
                      <span className="text-slate-400">{getTurkishStatusLabel(log.oldValue) || '-'}</span>
                      {' '}&rarr;{' '}
                      <span className="font-bold text-slate-900">{getTurkishStatusLabel(log.newValue) || '-'}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">-</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-500">
                  {log.ipAddress || '127.0.0.1'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setSelectedLog(log)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    <span>İncele</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {filteredLogs.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-400">
                  Denetim kaydı bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Log Payload Details Dialog */}
      <Dialog
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Denetim Kaydı JSON Detayı"
        description={`Kayıt ID: #${selectedLog?.id} • Kullanıcı: ${selectedLog?.username}`}
        maxWidth="lg"
      >
        {selectedLog && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1 text-slate-700">
              <p><span className="font-bold text-slate-900">Aksiyon:</span> {selectedLog.action}</p>
              <p><span className="font-bold text-slate-900">Varlık:</span> {selectedLog.entityType} (ID: {selectedLog.entityId})</p>
              <p><span className="font-bold text-slate-900">Tarih:</span> {new Date(selectedLog.timestamp).toLocaleString('tr-TR')}</p>
              <p><span className="font-bold text-slate-900">IP:</span> {selectedLog.ipAddress || '127.0.0.1'}</p>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-1.5">Ayrıntılı JSON Yükü (Payload):</p>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-md overflow-x-auto text-[11px] leading-relaxed border border-slate-800">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Kapat
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
